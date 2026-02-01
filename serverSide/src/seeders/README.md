# Database Seeder

This seeder populates your MongoDB database with realistic test data for the Shop Master application.

## What Gets Seeded

### 1. Demo User (1)
- **Email:** demo@shopmaster.com
- **Password:** demo123
- **Name:** John Doe
- **Shop:** Shop Master Store
- **Role:** Admin
- Complete profile with address, shop settings, and preferences

### 2. Products (80)
Distributed across 8 categories:
- **Electronics** (10 products): Mouse, Cables, Speakers, Chargers, etc.
- **Clothing** (10 products): T-Shirts, Jeans, Hoodies, Sneakers, etc.
- **Food & Beverages** (10 products): Coffee, Tea, Snacks, Drinks, etc.
- **Books** (10 products): Novels, Cookbooks, Textbooks, etc.
- **Home & Garden** (10 products): Plants, Bulbs, Curtains, etc.
- **Sports** (10 products): Yoga Mats, Dumbbells, Balls, etc.
- **Toys** (10 products): Building Blocks, Games, Puzzles, etc.
- **Health & Beauty** (10 products): Creams, Shampoo, Vitamins, etc.

Each product includes:
- Realistic pricing (30-100% markup)
- Stock levels (5-105 units)
- Unique barcodes (UPC_A, EAN_13, CODE_128, QR_CODE)
- Expiry dates (for food items)

### 3. Sales History (150)
- Sales distributed over the past 90 days
- 1-5 items per sale
- Realistic quantities (1-3 per item)
- Calculated totals and profits

## How to Run

### Prerequisites
Make sure your MongoDB connection is configured in `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/shop-master
```

### Run the Seeder

From the `serverSide` directory:

```bash
npm run seed
```

Or directly:

```bash
node src/seeders/seed.js
```

## What Happens

1. **Connects** to MongoDB
2. **Clears** all existing data (Users, Products, Sales)
3. **Creates** demo user with hashed password
4. **Generates** 80 products across 8 categories
5. **Creates** 150 sales with random dates and items
6. **Displays** summary and login credentials

## Output Example

```
🌱 Starting database seeding...
✅ Connected to MongoDB
🗑️  Clearing existing data...
✅ Existing data cleared
👤 Creating demo user...
✅ Demo user created: demo@shopmaster.com / demo123
📦 Creating products...
✅ Created 80 products
💰 Creating sales history...
✅ Created 150 sales

📊 Seeding Summary:
==================
👤 Users: 1
📦 Products: 80
💰 Sales: 150

🔐 Login Credentials:
==================
Email: demo@shopmaster.com
Password: demo123

✅ Database seeding completed successfully!
```

## Testing the Application

After seeding, you can:

1. **Login** with demo@shopmaster.com / demo123
2. **View Inventory** - See all 80 products
3. **Create Sales** - Products are in stock and ready
4. **View Reports** - 150 sales provide rich analytics
5. **Check Settings** - User profile is fully populated

## Data Characteristics

### Products
- **Price Range:** $10 - $100
- **Stock Range:** 5 - 105 units
- **Markup:** 30% - 100%
- **Barcodes:** Unique, scannable formats
- **Categories:** 8 diverse categories

### Sales
- **Date Range:** Last 90 days
- **Items per Sale:** 1-5 products
- **Quantity per Item:** 1-3 units
- **Total Sales:** 150 transactions
- **Revenue:** Varies based on products sold

### User
- **Complete Profile:** Name, email, phone, address
- **Shop Settings:** Business type, description, tax ID
- **Preferences:** Currency, language, theme, notifications

## Customization

You can modify the seeder to:

1. **Change quantities:**
   ```javascript
   const salesCount = 150; // Change number of sales
   ```

2. **Add more products:**
   ```javascript
   const productNames = {
     'Electronics': ['Product 1', 'Product 2', ...],
     // Add more categories or products
   };
   ```

3. **Adjust date range:**
   ```javascript
   date: randomDate(90), // Change from 90 days
   ```

4. **Modify user data:**
   ```javascript
   const demoUser = await User.create({
     // Customize user fields
   });
   ```

## Troubleshooting

### Connection Error
```
Error: connect ECONNREFUSED
```
**Solution:** Make sure MongoDB is running and MONGODB_URI is correct

### Duplicate Key Error
```
Error: E11000 duplicate key error
```
**Solution:** The seeder clears data first, but if it fails midway, manually clear the database

### Module Not Found
```
Error: Cannot find module 'bcryptjs'
```
**Solution:** Run `npm install` in the serverSide directory

## Re-seeding

You can run the seeder multiple times. Each run will:
1. Delete all existing data
2. Create fresh data
3. Reset to the same demo user credentials

This is useful for:
- Resetting test data
- Starting fresh after testing
- Demonstrating the application

## Notes

- **Password:** All passwords are hashed with bcrypt
- **Barcodes:** Generated randomly but follow format standards
- **Dates:** Sales dates are randomized within the past 90 days
- **Stock:** Products have sufficient stock for testing sales
- **Profit:** Calculated automatically based on purchase/selling prices

## Security

⚠️ **Important:** This seeder is for development/testing only!

- Uses a simple demo password
- Clears all data without confirmation
- Should NOT be used in production
- Demo credentials should be changed in production

---

Happy Testing! 🚀
