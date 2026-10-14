/**
 * Dakingo Bakery - Interactive Application Logic
 */

// Product Master Catalog
const PRODUCTS = [
  {
    id: 1,
    name: "Rich Chocolate Truffle Cake",
    category: "classic",
    price: 500,
    oldPrice: 600,
    rating: 5,
    reviews: 500,
    image: "images/bestseller_truffle.jpg",
    description: "Rich dark chocolate sponge layered with silken Dutch truffle ganache and topped with handcrafted chocolate curls."
  },
  {
    id: 2,
    name: "Choco Chip Truffle Cake",
    category: "classic",
    price: 589,
    oldPrice: 699,
    rating: 5,
    reviews: 350,
    image: "images/bestseller_choco_chip.jpg",
    description: "Decadent chocolate mousse infused with crisp bittersweet chocolate chips and bordered with ganache rosettes."
  },
  {
    id: 3,
    name: "Tropical Fruit N Almond Cake",
    category: "gourmet",
    price: 599,
    oldPrice: 699,
    rating: 5,
    reviews: 368,
    image: "images/bestseller_fruit_almond.jpg",
    description: "Fluffy vanilla sponge enveloped in light diplomat cream, topped with fresh seasonal kiwi, apricots, and roasted California almonds."
  },
  {
    id: 4,
    name: "Rich Butterscotch Crunch Cake",
    category: "desserts",
    price: 399,
    oldPrice: 499,
    rating: 5,
    reviews: 308,
    image: "images/bestseller_butterscotch.jpg",
    description: "Golden brown sponge layered with real butterscotch caramel fudge and roasted cashew praline crunch."
  },
  {
    id: 5,
    name: "Molten Chocolate Lava Cake",
    category: "desserts",
    price: 249,
    oldPrice: 299,
    rating: 5,
    reviews: 420,
    image: "images/hero_lava_cake.jpg",
    description: "Warm single-serve chocolate soufflé with a molten liquid center of pure dark chocolate ganache."
  },
  {
    id: 6,
    name: "Decadent Layered Brownie Slice",
    category: "desserts",
    price: 199,
    oldPrice: 249,
    rating: 5,
    reviews: 280,
    image: "images/hero_brownie_slice.jpg",
    description: "Fudgy dense chocolate brownie slice with velvety chocolate frosting and shaved chocolate."
  }
];

class DakingoStore {
  constructor() {
    this.cart = [];
    this.wishlist = new Set();
    this.appliedDiscount = 0; // 0.20 for 20%
    this.currentQuickViewProduct = null;
    this.currentWeightMultiplier = 1;
    this.activeCategory = "all";

    this.initElements();
    this.bindEvents();
    this.setupDatePickers();
  }

  initElements() {
    this.cartDrawer = document.getElementById("cartDrawer");
    this.cartOverlay = document.getElementById("cartOverlay");
    this.cartCountBadge = document.getElementById("cartCountBadge");
    this.cartItemsList = document.getElementById("cartItemsList");
    this.cartSubtotalText = document.getElementById("cartSubtotalText");
    this.cartDiscountRow = document.getElementById("cartDiscountRow");
    this.cartDiscountText = document.getElementById("cartDiscountText");
    this.cartTotalText = document.getElementById("cartTotalText");
    this.toastContainer = document.getElementById("toastContainer");
    this.searchInput = document.getElementById("searchInput");
  }

  bindEvents() {
    // Open / Close Cart
    document.getElementById("openCartBtn").addEventListener("click", () => this.openCart());
    document.getElementById("closeCartBtn").addEventListener("click", () => this.closeCart());
    this.cartOverlay.addEventListener("click", () => this.closeCart());

    // Order Now Buttons
    document.getElementById("orderNowHeaderBtn").addEventListener("click", () => this.openOrderModal());
    document.getElementById("cartCheckoutBtn").addEventListener("click", () => {
      this.closeCart();
      this.openOrderModal();
    });

    // Promo offer banner click
    const promoPill = document.getElementById("promoOfferPill");
    if (promoPill) {
      promoPill.addEventListener("click", () => {
        this.appliedDiscount = 0.20;
        this.updateCartUI();
        this.showToast("🎉 Promo BLISS20 applied! 20% OFF your entire basket.");
        const hint = document.getElementById("promoCopyHint");
        if (hint) hint.textContent = "COPIED & APPLIED!";
      });
    }

    // View All Products toggle
    const viewAllBtn = document.getElementById("viewAllBtn");
    if (viewAllBtn) {
      viewAllBtn.addEventListener("click", () => {
        this.renderAllProducts();
        this.showToast("Showing all freshly baked delicacies!");
      });
    }

    // Search events
    if (this.searchInput) {
      this.searchInput.addEventListener("input", (e) => this.filterProducts(e.target.value));
      document.getElementById("searchSubmitBtn").addEventListener("click", () => {
        this.filterProducts(this.searchInput.value);
      });
    }

    // Category click events
    document.querySelectorAll(".category-card").forEach(card => {
      card.addEventListener("click", () => {
        const cat = card.getAttribute("data-category");
        if (cat) {
          this.selectCategory(cat);
        }
      });
    });

    // Nav Links category filtering
    document.querySelectorAll(".nav-links a").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
        link.parentElement.classList.add("active");
        const cat = link.getAttribute("data-category") || "all";
        this.selectCategory(cat);
      });
    });

    // Magical Ticket Trigger
    const unlockBtn = document.getElementById("unlockTicketBtn");
    if (unlockBtn) {
      unlockBtn.addEventListener("click", () => this.openMagicalTicketModal());
    }
    const ticketVisual = document.getElementById("ticketVisualBtn");
    if (ticketVisual) {
      ticketVisual.addEventListener("click", () => this.openMagicalTicketModal());
    }

    // Auth trigger
    const loginTrigger = document.getElementById("loginModalTrigger");
    if (loginTrigger) {
      loginTrigger.addEventListener("click", () => this.openModal("authModal"));
    }

    // Floating Help Trigger
    const helpBtn = document.getElementById("floatingHelpBtn");
    if (helpBtn) {
      helpBtn.addEventListener("click", () => this.openHelpChat());
    }
  }

  setupDatePickers() {
    const dateInput = document.getElementById("deliveryDateInput");
    if (dateInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.value = tomorrow.toISOString().split("T")[0];
      dateInput.min = new Date().toISOString().split("T")[0];
    }
  }

  // --- CART MANAGEMENT ---
  addToCart(productId, weightMult = 1) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const unitPrice = Math.round(product.price * weightMult);
    const existingIndex = this.cart.findIndex(item => item.id === productId && item.weightMult === weightMult);

    if (existingIndex > -1) {
      this.cart[existingIndex].qty += 1;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        image: product.image,
        price: unitPrice,
        weightMult: weightMult,
        qty: 1
      });
    }

    this.updateCartUI();
    this.animateBadge();
    this.showToast(`🎂 Added "${product.name}" to your basket!`);
  }

  updateQty(index, change) {
    if (this.cart[index]) {
      this.cart[index].qty += change;
      if (this.cart[index].qty <= 0) {
        const removed = this.cart.splice(index, 1);
        this.showToast(`Removed "${removed[0].name}" from basket`);
      }
      this.updateCartUI();
    }
  }

  updateCartUI() {
    // Total quantity
    const totalCount = this.cart.reduce((sum, item) => sum + item.qty, 0);
    this.cartCountBadge.textContent = totalCount;

    // Subtotal
    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    this.cartSubtotalText.textContent = `₹${subtotal}`;

    // Discount
    const discountVal = Math.round(subtotal * this.appliedDiscount);
    if (this.appliedDiscount > 0 && subtotal > 0) {
      this.cartDiscountRow.style.display = "flex";
      this.cartDiscountText.textContent = `-₹${discountVal}`;
    } else {
      this.cartDiscountRow.style.display = "none";
    }

    // Total
    const finalTotal = Math.max(0, subtotal - discountVal);
    this.cartTotalText.textContent = `₹${finalTotal}`;

    // Render items list
    if (this.cart.length === 0) {
      this.cartItemsList.innerHTML = `
        <div class="cart-empty-message">
          <div style="font-size: 38px; margin-bottom: 8px;">🍰</div>
          <p style="font-weight: 700; color: var(--primary-red); margin-bottom: 4px;">Your basket is empty!</p>
          <p style="font-size: 11px;">Add our handcrafted chocolate cakes and sweet treats to start celebrating.</p>
        </div>
      `;
      document.getElementById("cartCheckoutBtn").disabled = true;
      document.getElementById("cartCheckoutBtn").style.opacity = "0.5";
    } else {
      document.getElementById("cartCheckoutBtn").disabled = false;
      document.getElementById("cartCheckoutBtn").style.opacity = "1";
      this.cartItemsList.innerHTML = this.cart.map((item, idx) => `
        <div class="cart-item-card">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-info">
            <h4 class="cart-item-name">${item.name}</h4>
            <div class="cart-item-price">₹${item.price}</div>
            <div class="cart-qty-ctrl">
              <button class="qty-btn" onclick="window.dakingoApp.updateQty(${idx}, -1)">−</button>
              <span class="qty-val">${item.qty}</span>
              <button class="qty-btn" onclick="window.dakingoApp.updateQty(${idx}, 1)">+</button>
            </div>
          </div>
        </div>
      `).join("");
    }
  }

  animateBadge() {
    this.cartCountBadge.classList.add("bump");
    setTimeout(() => {
      this.cartCountBadge.classList.remove("bump");
    }, 250);
  }

  openCart() {
    this.cartDrawer.classList.add("open");
    this.cartOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  closeCart() {
    this.cartDrawer.classList.remove("open");
    this.cartOverlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  // --- WISHLIST TOGGLE ---
  toggleWishlist(productId, btnElement) {
    if (this.wishlist.has(productId)) {
      this.wishlist.delete(productId);
      btnElement.classList.remove("active");
      this.showToast("Removed from Wishlist");
    } else {
      this.wishlist.add(productId);
      btnElement.classList.add("active");
      this.showToast("❤️ Saved to your Wishlist!");
    }
  }

  // --- QUICK VIEW MODAL ---
  quickViewItem(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    this.currentQuickViewProduct = product;
    this.currentWeightMultiplier = 1;

    document.getElementById("qvProductImg").src = product.image;
    document.getElementById("qvProductImg").alt = product.name;
    document.getElementById("qvProductTitle").textContent = product.name;
    document.getElementById("qvProductPrice").textContent = `₹${product.price}`;
    document.getElementById("qvProductOldPrice").textContent = `₹${product.oldPrice}`;

    // Reset weight buttons
    const buttons = document.querySelectorAll("#qvWeightSelector button");
    buttons.forEach((b, i) => {
      if (i === 0) {
        b.style.background = "var(--primary-red)";
        b.style.color = "#FFFFFF";
      } else {
        b.style.background = "#FFF0EB";
        b.style.color = "var(--primary-red)";
      }
    });

    this.openModal("quickViewModal");
  }

  selectWeight(weight, btn) {
    const multipliers = { 0.5: 1, 1.0: 1.85, 2.0: 3.5 };
    this.currentWeightMultiplier = multipliers[weight] || 1;

    const buttons = document.querySelectorAll("#qvWeightSelector button");
    buttons.forEach(b => {
      b.style.background = "#FFF0EB";
      b.style.color = "var(--primary-red)";
    });
    btn.style.background = "var(--primary-red)";
    btn.style.color = "#FFFFFF";

    if (this.currentQuickViewProduct) {
      const newPrice = Math.round(this.currentQuickViewProduct.price * this.currentWeightMultiplier);
      const newOldPrice = Math.round(this.currentQuickViewProduct.oldPrice * this.currentWeightMultiplier);
      document.getElementById("qvProductPrice").textContent = `₹${newPrice}`;
      document.getElementById("qvProductOldPrice").textContent = `₹${newOldPrice}`;
    }
  }

  addQuickViewToCart() {
    if (this.currentQuickViewProduct) {
      this.addToCart(this.currentQuickViewProduct.id, this.currentWeightMultiplier);
      this.closeModal("quickViewModal");
    }
  }

  // --- SEARCH & CATEGORY FILTER ---
  filterProducts(query) {
    const q = query.trim().toLowerCase();
    const cards = document.querySelectorAll(".product-card");

    cards.forEach(card => {
      const title = card.querySelector(".product-title")?.textContent.toLowerCase() || "";
      if (title.includes(q) || q === "") {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  }

  selectCategory(category) {
    this.activeCategory = category;

    // Highlight category tab
    document.querySelectorAll(".category-card").forEach(c => {
      if (c.getAttribute("data-category") === category) {
        c.classList.add("active");
      } else {
        c.classList.remove("active");
      }
    });

    const cards = document.querySelectorAll(".product-card");
    cards.forEach(card => {
      const cardCat = card.getAttribute("data-category");
      if (category === "all" || cardCat === category) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  }

  renderAllProducts() {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    // Ensure all 6 items are visible in grid
    grid.innerHTML = PRODUCTS.map(item => `
      <article class="product-card" data-product-id="${item.id}" data-category="${item.category}">
        <button class="wishlist-btn ${this.wishlist.has(item.id) ? 'active' : ''}" title="Add to Wishlist" onclick="window.dakingoApp.toggleWishlist(${item.id}, this)">
          <svg viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
        <div class="product-img-wrap" onclick="window.dakingoApp.quickViewItem(${item.id})">
          <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="product-info">
          <h3 class="product-title" onclick="window.dakingoApp.quickViewItem(${item.id})">${item.name}</h3>
          <div class="product-price-row">
            <span class="current-price">₹${item.price}</span>
            <span class="old-price">₹${item.oldPrice} (Save 15%)</span>
          </div>
          <div class="product-meta-row">
            <div class="rating-stars">
              <span class="star">★</span><span class="star">★</span><span class="star">★</span><span class="star">★</span><span class="star">★</span>
              <span class="reviews-count">${item.reviews}</span>
            </div>
            <button class="add-cart-circle-btn" title="Add to Cart" onclick="window.dakingoApp.addToCart(${item.id})">
              <svg viewBox="0 0 24 24">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </button>
          </div>
        </div>
      </article>
    `).join("");
  }

  // --- MODAL UTILITIES ---
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("open");
      document.body.style.overflow = "hidden";
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("open");
      document.body.style.overflow = "";
    }
  }

  openOrderModal() {
    if (this.cart.length === 0) {
      this.addToCart(1); // Add default bestseller cake so user can proceed smoothly
    }
    this.openModal("orderModal");
  }

  submitOrder(form) {
    const submitBtn = document.getElementById("confirmOrderSubmitBtn");
    submitBtn.textContent = "Processing Order...";
    submitBtn.disabled = true;

    setTimeout(() => {
      submitBtn.textContent = "ORDER CONFIRMED! 🎉";
      this.showToast("🎂 Order placed successfully! Order #DK-849201. Tracking SMS sent.");
      setTimeout(() => {
        this.closeModal("orderModal");
        submitBtn.textContent = "CONFIRM & PLACE ORDER 🎂";
        submitBtn.disabled = false;
        this.cart = [];
        this.updateCartUI();
      }, 1500);
    }, 1000);
  }

  // --- THE MAGICAL TICKET FLOW ---
  openMagicalTicketModal() {
    this.openModal("ticketModal");
  }

  claimTicketReward() {
    const btn = document.getElementById("claimTicketBtn");
    btn.textContent = "Saving Reminders...";
    btn.disabled = true;

    setTimeout(() => {
      btn.style.display = "none";
      const successBox = document.getElementById("ticketSuccessBox");
      if (successBox) successBox.style.display = "block";
      this.appliedDiscount = 0.20;
      this.updateCartUI();
      this.showToast("🎁 ₹750 Voucher MAGIC750 Unlocked & Copied!");
    }, 700);
  }

  // --- AUTH TABS ---
  switchAuthTab(tab) {
    const loginTab = document.getElementById("authTabLogin");
    const signupTab = document.getElementById("authTabSignup");
    const nameField = document.getElementById("nameFieldGroup");
    const submitBtn = document.getElementById("authSubmitBtn");

    if (tab === "login") {
      loginTab.style.color = "var(--primary-red)";
      signupTab.style.color = "#9E8587";
      nameField.style.display = "none";
      submitBtn.textContent = "LOG IN";
    } else {
      signupTab.style.color = "var(--primary-red)";
      loginTab.style.color = "#9E8587";
      nameField.style.display = "block";
      submitBtn.textContent = "CREATE ACCOUNT";
    }
  }

  submitAuth(form) {
    const email = document.getElementById("authEmailInput").value;
    const trigger = document.getElementById("loginModalTrigger");
    if (trigger) {
      trigger.textContent = "Hi, " + (email.split("@")[0] || "Rahul");
      trigger.style.color = "var(--primary-red)";
    }
    this.closeModal("authModal");
    this.showToast("✨ Welcome back! You are logged in.");
  }

  // --- HELP CHAT BOT ---
  openHelpChat() {
    this.openModal("helpModal");
  }

  sendChatQuery(query) {
    const history = document.getElementById("chatHistoryBox");
    if (!history) return;

    // User message
    const userMsg = document.createElement("div");
    userMsg.style.cssText = "align-self: flex-end; background: var(--primary-red); color: #fff; padding: 8px 12px; border-radius: 12px 12px 2px 12px; font-size: 11.5px;";
    userMsg.textContent = query;
    history.appendChild(userMsg);

    // Bot response lookup
    const responses = {
      "Can I order a customized theme cake?": "Yes! Our master decorators create personalized fondant, photo cakes, and tier designs. WhatsApp us your design at +91 99999 00000.",
      "Do you offer Midnight Delivery?": "Yes! We offer guaranteed midnight surprise delivery between 11:00 PM and 12:00 AM across all major pin codes.",
      "Are all your cakes 100% Eggless?": "Yes, all our chocolate truffle, black forest, fruit, and butterscotch cakes are 100% pure vegetarian / eggless by default without compromising taste!"
    };

    setTimeout(() => {
      const botMsg = document.createElement("div");
      botMsg.style.cssText = "align-self: flex-start; background: #fff; color: var(--text-main); padding: 8px 12px; border-radius: 12px 12px 12px 2px; font-size: 11.5px; border: 1px solid #F0DCD4;";
      botMsg.textContent = responses[query] || "Thank you for asking! Our pastry chef will connect with you right away.";
      history.appendChild(botMsg);
    }, 450);
  }

  // --- FOOTER & POLICIES ---
  showStoryModal() {
    this.showToast("Dakingo was founded with one dream: honest ingredients & pure chocolate joy!");
  }

  showPolicy(type) {
    const messages = {
      cancellation: "Cancellations allowed up to 4 hours prior to chosen delivery slot with 100% refund.",
      privacy: "Your personal details & address are 256-bit encrypted and never shared.",
      terms: "All bakery items are freshly prepared following strict FSSAI safety norms."
    };
    this.showToast(messages[type] || "Terms & Policies updated 2026.");
  }

  handleNewsletter(form) {
    const input = form.querySelector("input");
    if (input && input.value) {
      this.showToast("🎉 Subscribed! You will receive our secret weekend cake recipes & coupons.");
      input.value = "";
    }
  }

  // --- TOAST NOTIFICATIONS ---
  showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span>🧁</span><span>${message}</span>`;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(15px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

// Instantiate App on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  window.dakingoApp = new DakingoStore();
});
