const { Schema, model} = require('mongoose');

// Promo Code Schema
const promoCodeSchema = new Schema({
    code: { type: String, unique: true , require: true},
    userId: {         
        type: Schema.Types.ObjectId,
        ref: 'User',
        require: true,
    },
    usersUsed: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    createdAt: { type: Date, default: Date.now }
  });
  
const PromoCode = model('PromoCode', promoCodeSchema);

module.exports = PromoCode;