import mongoose from 'mongoose';
import { config } from '../config/env';
import User from '../models/User';
import Mess from '../models/Mess';
import Plan from '../models/Plan';
import Coupon from '../models/Coupon';
import { logger } from '../utils/logger';

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.mongodb.uri);
    logger.info('Connected to database for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Mess.deleteMany({});
    await Plan.deleteMany({});
    await Coupon.deleteMany({});
    logger.info('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@bachos.com',
      password: 'admin123', // Will be hashed by pre-save hook
      role: 'admin',
    });
    await adminUser.save();
    logger.info('Created admin user');

    // Create sample plans
    const plans = [
      {
        name: 'Basic Plan',
        description: 'Perfect for small messes with up to 5 members',
        maxMembers: 5,
        planType: 'monthly',
        duration: 1, // 1 month
        price: 500,
        currency: 'BDT',
        features: ['Basic meal tracking', 'Expense management', 'Monthly reports', 'Email support'],
        createdBy: adminUser._id,
      },
      {
        name: 'Standard Plan',
        description: 'Ideal for medium messes with up to 15 members',
        maxMembers: 15,
        planType: 'monthly',
        duration: 1,
        price: 1200,
        currency: 'BDT',
        features: [
          'Advanced meal tracking',
          'Expense management',
          'Monthly & yearly reports',
          'Priority support',
          'Guest meal management',
        ],
        createdBy: adminUser._id,
      },
      {
        name: 'Premium Plan',
        description: 'For large messes with unlimited members',
        maxMembers: 100,
        planType: 'monthly',
        duration: 1,
        price: 2500,
        currency: 'BDT',
        features: [
          'All Standard features',
          'AI-powered insights',
          'Advanced analytics',
          'Custom reports',
          '24/7 support',
          'API access',
        ],
        createdBy: adminUser._id,
      },
    ];

    await Plan.insertMany(plans);
    logger.info('Created sample plans');

    // Create sample coupons
    const coupons = [
      {
        code: 'WELCOME10',
        description: '10% off for new customers',
        discountType: 'percentage',
        discountValue: 10,
        maxUses: 100,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        applicablePlans: [],
        createdBy: adminUser._id,
      },
      {
        code: 'SAVE500',
        description: 'Fixed discount of 500 BDT',
        discountType: 'fixed',
        discountValue: 500,
        maxUses: 50,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
        applicablePlans: [],
        createdBy: adminUser._id,
      },
    ];

    await Coupon.insertMany(coupons);
    logger.info('Created sample coupons');

    // Create sample mess and manager
    const managerUser = new User({
      name: 'John Manager',
      email: 'manager@bachos.com',
      password: 'manager123',
      role: 'manager',
      phone: '+8801712345678',
    });
    await managerUser.save();

    const sampleMess = new Mess({
      name: 'Green Valley Mess',
      description: 'A modern mess for students and professionals',
      address: '123 Green Valley Road, Dhaka',
      managerId: managerUser._id,
      members: [managerUser._id],
      mealRate: 50,
      currency: '৳',
    });
    await sampleMess.save();

    // Update manager with mess ID
    managerUser.messId = sampleMess._id;
    await managerUser.save();

    // Create sample members
    const members = [
      {
        name: 'Alice Johnson',
        email: 'alice@bachos.com',
        password: 'member123',
        role: 'user',
        messId: sampleMess._id,
        phone: '+8801712345679',
        dateOfBirth: new Date('1995-05-15'),
      },
      {
        name: 'Bob Smith',
        email: 'bob@bachos.com',
        password: 'member123',
        role: 'user',
        messId: sampleMess._id,
        phone: '+8801712345680',
        dateOfBirth: new Date('1992-08-22'),
      },
      {
        name: 'Charlie Brown',
        email: 'charlie@bachos.com',
        password: 'member123',
        role: 'user',
        messId: sampleMess._id,
        phone: '+8801712345681',
        dateOfBirth: new Date('1990-12-10'),
      },
    ];

    const createdMembers = await User.insertMany(members);

    // Add members to mess
    sampleMess.members.push(...createdMembers.map((m) => m._id));
    await sampleMess.save();

    logger.info('Created sample mess and members');
    logger.info('Database seeding completed successfully!');
    logger.info('');
    logger.info('Sample accounts created:');
    logger.info('Admin: admin@bachos.com / admin123');
    logger.info('Manager: manager@bachos.com / manager123');
    logger.info('Members: alice@bachos.com, bob@bachos.com, charlie@bachos.com / member123');
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from database');
  }
};

// Run seeder
seedDatabase();
