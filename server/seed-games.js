#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

const Game = require('./models/Game');

const seedGames = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gameverse', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB\n');

    // Delete existing games
    await Game.deleteMany({});
    console.log('🗑️  Cleared existing games\n');

    // Create sample games
    const games = [
      {
        title: 'Cyber Warriors 2077',
        description: 'An immersive open-world action RPG set in a dystopian future where technology and humanity collide. Experience intense combat, deep character customization, and a gripping story.',
        genre: 'RPG',
        releaseDate: new Date('2024-03-15'),
        rating: 9.2,
        platform: ['PC', 'PlayStation', 'Xbox'],
        developer: 'Future Games Studio',
        imageUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800',
        buyPrice: 59.99,
        rentPrice: 9.99,
      },
      {
        title: 'Kingdom Legends',
        description: 'Build your empire, command vast armies, and conquer legendary kingdoms in this epic strategy game. Features real-time battles and deep strategic gameplay.',
        genre: 'Strategy',
        releaseDate: new Date('2023-11-20'),
        rating: 8.7,
        platform: ['PC', 'Mobile'],
        developer: 'Strategic Minds Inc',
        imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
        buyPrice: 39.99,
        rentPrice: 5.99,
      },
      {
        title: 'Horror Asylum',
        description: 'Survive the night in this terrifying psychological horror game. Explore dark corridors, solve puzzles, and escape from unspeakable horrors lurking in the shadows.',
        genre: 'Horror',
        releaseDate: new Date('2024-10-31'),
        rating: 8.9,
        platform: ['PC', 'PlayStation', 'Xbox'],
        developer: 'Nightmare Studios',
        imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800',
        buyPrice: 29.99,
        rentPrice: 4.99,
      },
      {
        title: 'Speed Rivals',
        description: 'Experience the thrill of high-speed racing with stunning graphics and realistic physics. Customize your cars, compete online, and become the ultimate racing champion.',
        genre: 'Sports',
        releaseDate: new Date('2024-06-10'),
        rating: 9.0,
        platform: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
        developer: 'Velocity Games',
        imageUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800',
        buyPrice: 49.99,
        rentPrice: 7.99,
      },
      {
        title: 'Pixel Quest',
        description: 'A charming indie adventure game with retro pixel art graphics. Explore vast worlds, discover hidden secrets, and experience a heartwarming story about friendship and courage.',
        genre: 'Indie',
        releaseDate: new Date('2024-02-14'),
        rating: 8.5,
        platform: ['PC', 'Nintendo', 'Mobile'],
        developer: 'Indie Craft Studios',
        imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
        buyPrice: 19.99,
        rentPrice: 2.99,
      },
    ];

    const createdGames = await Game.insertMany(games);
    
    console.log('✅ Successfully created games:\n');
    createdGames.forEach(game => {
      console.log(`   📦 ${game.title} (${game.genre})`);
      console.log(`      Buy: $${game.buyPrice} | Rent: $${game.rentPrice}/7d`);
      console.log(`      Rating: ${game.rating}/10`);
      console.log('');
    });

    console.log(`✅ Total games created: ${createdGames.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedGames();
