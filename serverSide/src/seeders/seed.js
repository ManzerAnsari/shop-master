import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";

dotenv.config();

// Sample data
const categories = [
  "Electronics",
  "Clothing",
  "Food & Beverages",
  "Books",
  "Home & Garden",
  "Sports",
  "Toys",
  "Health & Beauty",
];

const productNames = {
  Electronics: [
    "Wireless Mouse",
    "USB-C Cable",
    "Bluetooth Speaker",
    "Phone Charger",
    "Laptop Stand",
    "Webcam HD",
    "Keyboard Mechanical",
    "Headphones Premium",
    "Power Bank",
    "HDMI Cable",
  ],
  Clothing: [
    "T-Shirt Cotton",
    "Jeans Denim",
    "Hoodie Fleece",
    "Sneakers Running",
    "Cap Baseball",
    "Socks Pack",
    "Jacket Winter",
    "Dress Summer",
    "Shorts Athletic",
    "Sweater Wool",
  ],
  "Food & Beverages": [
    "Coffee Beans",
    "Green Tea",
    "Chocolate Bar",
    "Energy Drink",
    "Protein Powder",
    "Granola Bars",
    "Mineral Water",
    "Juice Orange",
    "Cookies Pack",
    "Nuts Mixed",
  ],
  Books: [
    "Novel Fiction",
    "Cookbook Italian",
    "Self-Help Guide",
    "Biography",
    "Science Textbook",
    "Art Book",
    "Travel Guide",
    "Comic Book",
    "Poetry Collection",
    "History Book",
  ],
  "Home & Garden": [
    "Plant Pot",
    "LED Bulb",
    "Curtains",
    "Pillow Memory Foam",
    "Blanket Soft",
    "Wall Clock",
    "Picture Frame",
    "Candle Scented",
    "Vase Ceramic",
    "Doormat",
  ],
  Sports: [
    "Yoga Mat",
    "Dumbbell Set",
    "Tennis Racket",
    "Basketball",
    "Jump Rope",
    "Resistance Bands",
    "Water Bottle",
    "Gym Bag",
    "Running Shoes",
    "Fitness Tracker",
  ],
  Toys: [
    "Building Blocks",
    "Action Figure",
    "Board Game",
    "Puzzle 1000pc",
    "RC Car",
    "Doll House",
    "Art Set",
    "Science Kit",
    "Stuffed Animal",
    "LEGO Set",
  ],
  "Health & Beauty": [
    "Face Cream",
    "Shampoo",
    "Toothpaste",
    "Vitamin C",
    "Hand Sanitizer",
    "Lip Balm",
    "Sunscreen SPF50",
    "Body Lotion",
    "Hair Brush",
    "Nail Polish",
  ],
};

const barcodeTypes = ["UPC_A", "EAN_13", "CODE_128", "QR_CODE"];

// Generate random barcode
function generateBarcode(type) {
  switch (type) {
    case "UPC_A":
      return (
        "0" +
        Math.floor(Math.random() * 10000000000)
          .toString()
          .padStart(11, "0")
      );
    case "EAN_13":
      return Math.floor(Math.random() * 1000000000000)
        .toString()
        .padStart(13, "0");
    case "CODE_128":
      return (
        "CODE" +
        Math.floor(Math.random() * 100000000)
          .toString()
          .padStart(8, "0")
      );
    case "QR_CODE":
      return (
        "QR" +
        Math.floor(Math.random() * 1000000000)
          .toString()
          .padStart(10, "0")
      );
    default:
      return Math.floor(Math.random() * 1000000000000).toString();
  }
}

// Generate random date in the past
function randomDate(daysAgo = 90) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString().split("T")[0];
}

// Major festivals to boost sales
const festivalDates = [
  "01-14",
  "01-26",
  "02-26",
  "03-14",
  "03-31",
  "04-14",
  "08-15",
  "08-27",
  "10-02",
  "10-20",
  "12-25",
];

const isFestivalDate = (date) => {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return festivalDates.includes(`${month}-${day}`);
};

// Seed function
async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await User.deleteMany({});
    await Product.deleteMany({});
    await Sale.deleteMany({});
    console.log("✅ Existing data cleared");

    // Create demo user
    console.log("👤 Creating demo user...");
    const hashedPassword = await bcrypt.hash("demo123", 10);

    const demoUser = await User.create({
      username: "demo",
      password: hashedPassword,
      email: "demo@shopmaster.com",
      firstName: "John",
      lastName: "Doe",
      phone: "+1 234 567 8900",
      dateOfBirth: new Date("1990-01-15"),
      gender: "male",
      shopName: "Shop Master Store",
      role: "admin",
      address: {
        street: "123 Main Street",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "USA",
      },
      shopSettings: {
        address: "123 Main Street, New York, NY 10001",
        businessType: "electronics",
        phone: "+1 234 567 8900",
        description: "Your one-stop shop for quality products",
        taxId: "TAX123456789",
        website: "https://shopmaster.com",
      },
      preferences: {
        currency: "USD",
        language: "en",
        theme: "light",
        notifications: true,
        emailUpdates: false,
      },
      isActive: true,
      isEmailVerified: true,
      lastLogin: new Date(),
    });

    console.log(`✅ Demo user created: ${demoUser.email} / demo123`);

    // Create products
    console.log("📦 Creating products...");
    const products = [];

    for (const category of categories) {
      const productList = productNames[category];
      for (let i = 0; i < productList.length; i++) {
        const purchasePrice = Math.floor(Math.random() * 50) + 10;
        const markup = 1.3 + Math.random() * 0.7; // 30-100% markup
        const sellingPrice = Math.floor(purchasePrice * markup);
        const stock = Math.floor(Math.random() * 100) + 5;
        const barcodeType =
          barcodeTypes[Math.floor(Math.random() * barcodeTypes.length)];

        const product = await Product.create({
          userId: demoUser._id,
          name: productList[i],
          category: category,
          purchasePrice: purchasePrice,
          sellingPrice: sellingPrice,
          stock: stock,
          barcode: generateBarcode(barcodeType),
          barcodeType: barcodeType,
          expiryDate:
            category === "Food & Beverages" ? randomDate(365) : undefined,
        });

        products.push(product);
      }
    }

    console.log(`✅ Created ${products.length} products`);

    // Create sales history
    console.log("💰 Creating sales history...");
    const daysToGenerate = 90;

    // Helper to generate sales for a specific date
    const generateSalesForDate = async (
      date,
      isFestival = false,
      growthFactor = 1.0
    ) => {
      // Boost sales on festival days and apply growth factor
      const baseSales = isFestival ? 8 : 2;
      const randomFactor = isFestival ? 6 : 4;
      const salesPerDay = Math.floor(
        (Math.random() * randomFactor + baseSales) * growthFactor
      );

      for (let saleNum = 0; saleNum < salesPerDay; saleNum++) {
        // Random number of items per sale (1-5), more items on festivals
        const maxItems = isFestival ? 8 : 5;
        const itemCount = Math.floor(Math.random() * maxItems) + 1;
        const saleItems = [];
        let totalAmount = 0;
        let totalProfit = 0;

        // Select random products for this sale
        const selectedProducts = [];
        for (let j = 0; j < itemCount; j++) {
          const randomProduct =
            products[Math.floor(Math.random() * products.length)];

          // Avoid duplicate products in same sale
          if (!selectedProducts.find((p) => p._id.equals(randomProduct._id))) {
            selectedProducts.push(randomProduct);
          }
        }

        // Create sale items
        for (const product of selectedProducts) {
          const qty = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
          const itemTotal = product.sellingPrice * qty;
          const itemProfit =
            (product.sellingPrice - product.purchasePrice) * qty;

          saleItems.push({
            productId: product._id,
            name: product.name,
            qty: qty,
            unitPrice: product.sellingPrice,
            purchasePrice: product.purchasePrice,
            profit: itemProfit,
          });

          totalAmount += itemTotal;
          totalProfit += itemProfit;
        }

        await Sale.create({
          userId: demoUser._id,
          date: date.toISOString().split("T")[0],
          items: saleItems,
          totalAmount: totalAmount,
          totalProfit: totalProfit,
          createdAt: date, // Set createdAt to match the date for accurate sorting
        });
      }
    };

    // 1. Generate CURRENT sales (past 90 days) - 20% growth
    console.log("   Generating current year sales...");
    for (let day = 0; day < daysToGenerate; day++) {
      const saleDate = new Date();
      saleDate.setDate(saleDate.getDate() - day);
      await generateSalesForDate(saleDate, isFestivalDate(saleDate), 1.2);
    }

    // 2. Generate HISTORICAL sales (1 year ago) - baseline
    console.log("   Generating historical sales (1 year ago)...");
    for (let day = 0; day < daysToGenerate; day++) {
      const saleDate = new Date();
      saleDate.setFullYear(saleDate.getFullYear() - 1);
      saleDate.setDate(saleDate.getDate() - day);
      await generateSalesForDate(saleDate, isFestivalDate(saleDate), 1.0);
    }

    // 3. Generate HISTORICAL sales (2 years ago) - 20% less
    console.log("   Generating historical sales (2 years ago)...");
    for (let day = 0; day < daysToGenerate; day++) {
      const saleDate = new Date();
      saleDate.setFullYear(saleDate.getFullYear() - 2);
      saleDate.setDate(saleDate.getDate() - day);
      await generateSalesForDate(saleDate, isFestivalDate(saleDate), 0.8);
    }

    const totalSales = await Sale.countDocuments();
    console.log(`✅ Created ${totalSales} sales records (3 Years History)`);

    // Summary
    console.log("\n📊 Seeding Summary:");
    console.log("==================");
    console.log(`👤 Users: 1`);
    console.log(`📦 Products: ${products.length}`);
    console.log(`💰 Sales: ${totalSales}`);
    console.log("\n🔐 Login Credentials:");
    console.log("==================");
    console.log("Email: demo@shopmaster.com");
    console.log("Password: demo123");
    console.log("\n✅ Database seeding completed successfully!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run seeder
seedDatabase();
