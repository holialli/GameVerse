// Guards the SMTP -> Ethereal -> MailHog fallback chain in emailService.
// Added alongside the nodemailer 8 -> 9 major upgrade (advisory GHSA-p6gq-j5cr-w38f,
// the message-level `raw` option bypassing disableFileAccess/disableUrlAccess -
// this codebase never passes `raw`, but the major bump still had to be proven
// safe across all three transports rather than forced blindly).
const mockCreateTransport = jest.fn();
const mockCreateTestAccount = jest.fn();
const mockSendMail = jest.fn();
const mockVerify = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: (...args) => mockCreateTransport(...args),
  createTestAccount: (...args) => mockCreateTestAccount(...args),
  getTestMessageUrl: () => null,
}));

const ENV_KEYS = ['NODE_ENV', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'RESEND_API_KEY', 'EMAIL_PASSWORD'];

describe('emailService transport fallback chain', () => {
  let savedEnv;

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    savedEnv = {};
    ENV_KEYS.forEach((key) => {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    });

    mockCreateTransport.mockReset();
    mockCreateTestAccount.mockReset();
    mockSendMail.mockReset();
    mockVerify.mockReset();

    mockSendMail.mockResolvedValue({ messageId: 'msg-1', response: '250 OK' });
    mockCreateTransport.mockReturnValue({ sendMail: mockSendMail, verify: mockVerify });
  });

  afterEach(() => {
    ENV_KEYS.forEach((key) => {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    });
  });

  // The transporter is cached at module scope, so each scenario needs a fresh
  // module registry or it inherits the previous test's transport.
  const loadService = () => {
    jest.resetModules();
    return require('../services/emailService');
  };

  describe('tier 1: real SMTP', () => {
    it('builds a verified SMTP transport and sends through it', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '465';
      process.env.SMTP_USER = 'apikey';
      process.env.SMTP_PASS = 'super-secret';
      mockVerify.mockResolvedValue(true);

      const emailService = loadService();
      const info = await emailService.sendWelcomeEmail('player@example.com', 'Ali');

      expect(mockCreateTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 465,
        secure: true, // port 465 implies implicit TLS
        auth: { user: 'apikey', pass: 'super-secret' },
      });
      expect(mockVerify).toHaveBeenCalled();
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(info.messageId).toBe('msg-1');

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.to).toBe('player@example.com');
      expect(mailOptions.from).toContain('game-verse.tech');
      // The advisory is about the message-level `raw` option; we must never set it.
      expect(mailOptions.raw).toBeUndefined();
    });

    it('caches the transport instead of rebuilding it per send', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PASS = 'super-secret';
      mockVerify.mockResolvedValue(true);

      const emailService = loadService();
      await emailService.sendWelcomeEmail('a@example.com', 'A');
      await emailService.sendWelcomeEmail('b@example.com', 'B');

      expect(mockCreateTransport).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(2);
    });

    it('accepts RESEND_API_KEY in place of SMTP_PASS', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SMTP_HOST = 'smtp.resend.com';
      process.env.RESEND_API_KEY = 're_test_key';
      mockVerify.mockResolvedValue(true);

      const emailService = loadService();
      await emailService.sendWelcomeEmail('player@example.com', 'Ali');

      expect(mockCreateTransport.mock.calls[0][0].auth).toEqual({
        user: 'resend', // default when SMTP_USER is unset
        pass: 're_test_key',
      });
    });

    it('does not fall through to Ethereal when SMTP verification fails', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PASS = 'wrong';
      mockVerify.mockRejectedValue(new Error('535 auth failed'));

      const emailService = loadService();

      // Non-critical mail swallows the error so registration still succeeds...
      await expect(emailService.sendWelcomeEmail('a@example.com', 'A')).resolves.toBeUndefined();
      // ...but a password reset must surface it, since the user is waiting on it.
      await expect(emailService.sendPasswordResetEmail('a@example.com', 'tok', 'A')).rejects.toThrow();

      expect(mockCreateTestAccount).not.toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  describe('tier 2: Ethereal (dev/test, no SMTP configured)', () => {
    it.each(['development', 'test'])('creates an Ethereal account in NODE_ENV=%s', async (env) => {
      process.env.NODE_ENV = env;
      mockCreateTestAccount.mockResolvedValue({ user: 'ethereal-user', pass: 'ethereal-pass' });

      const emailService = loadService();
      await emailService.sendWelcomeEmail('player@example.com', 'Ali');

      expect(mockCreateTransport).toHaveBeenCalledWith({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: 'ethereal-user', pass: 'ethereal-pass' },
      });
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('tier 3: MailHog (Ethereal unreachable)', () => {
    it('falls back to localhost:1025 when createTestAccount fails', async () => {
      process.env.NODE_ENV = 'development';
      mockCreateTestAccount.mockRejectedValue(new Error('offline'));

      const emailService = loadService();
      await emailService.sendWelcomeEmail('player@example.com', 'Ali');

      expect(mockCreateTransport).toHaveBeenCalledWith({
        host: 'localhost',
        port: 1025,
        secure: false,
      });
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('production with no transport at all', () => {
    it('throws rather than silently degrading to MailHog', async () => {
      process.env.NODE_ENV = 'production';

      const emailService = loadService();

      await expect(emailService.sendWelcomeEmail('a@example.com', 'A')).resolves.toBeUndefined();
      await expect(emailService.sendPasswordResetEmail('a@example.com', 'tok', 'A')).rejects.toThrow(
        /Failed to send password reset email/,
      );

      expect(mockCreateTransport).not.toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });
});
