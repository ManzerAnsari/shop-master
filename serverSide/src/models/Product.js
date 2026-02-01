
import mongoose from 'mongoose'
const productSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  purchasePrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  expiryDate: { type: String }, // Optional for non-perishables
  barcode: { 
    type: String, 
    sparse: true, // Allows null/undefined but enforces uniqueness when present
    index: true 
  },
  barcodeType: { 
    type: String, 
    enum: ['UPC_A', 'UPC_E', 'EAN_8', 'EAN_13', 'CODE_128', 'CODE_39', 'QR_CODE', null],
    default: null
  },
}, { timestamps: true })

export default mongoose.model('Product', productSchema)
