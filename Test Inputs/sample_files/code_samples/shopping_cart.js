/**
 * Sample JavaScript code for testing code file ingestion
 * Purpose: E-commerce shopping cart functionality
 */

class ShoppingCart {
  constructor() {
    this.items = [];
    this.total = 0;
  }

  /**
   * Add an item to the cart
   * @param {Object} product - Product object with id, name, price
   * @param {number} quantity - Quantity to add
   */
  addItem(product, quantity = 1) {
    const existingItem = this.items.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity
      });
    }
    
    this.updateTotal();
  }

  /**
   * Remove an item from the cart
   * @param {string} productId - Product ID to remove
   */
  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.updateTotal();
  }

  /**
   * Update the total cart value
   */
  updateTotal() {
    this.total = this.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  }

  /**
   * Get cart summary
   * @returns {Object} Cart summary with items and total
   */
  getSummary() {
    return {
      items: this.items,
      itemCount: this.items.reduce((count, item) => count + item.quantity, 0),
      total: this.total.toFixed(2)
    };
  }

  /**
   * Clear all items from cart
   */
  clear() {
    this.items = [];
    this.total = 0;
  }
}

// Export for use in other modules
module.exports = ShoppingCart;
