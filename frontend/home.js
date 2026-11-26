/* =====================================================
   FOODKART - COMPLETE HOME.JS
   Navigation | Restaurants | Menus | Search
   Cart | Location Map | Profile | Theme
   ===================================================== */

(() => {
"use strict";

/* ================= ELEMENTS ================= */

const $ = id => document.getElementById(id);

const homePage = $("homePage");
const menuPage = $("menuPage");
const profilePage = $("profilePage");
const foodLocationSection = $("foodLocationSection");

const restaurantGrid = $("restaurantGrid");
const menuGrid = $("menuGrid");

const homeLink = $("homeLink");
const restaurantLink = $("restaurantLink");
const categoryLink = $("categoryLink");
const profileLink = $("profileLink");
const logoLink = $("logoLink");
const backToRestaurants = $("backToRestaurants");

const cartButton = $("cartButton");
const cartDrawer = $("cartDrawer");
const cartOverlay = $("cartOverlay");
const closeCart = $("closeCart");

const navLocationButton = $("navLocationButton");
const navLocationText = $("navLocationText");
const selectedLocationText = $("selectedLocationText");

const mapSearchInput = $("mapSearchInput");
const mapSearchButton = $("mapSearchButton");
const currentLocationButton = $("currentLocationButton");

const searchInput = $("searchInput");
const searchButton = $("searchButton");
const searchSuggestions = $("searchSuggestions");

const footer = $("mainFooter");

/* ================= CONSTANTS ================= */

const DEFAULT_LATITUDE = 17.9689;
const DEFAULT_LONGITUDE = 79.5941;

const DELIVERY_FEE = 30;
const PLATFORM_FEE = 5;

let foodKartMap = null;
let currentLocationMarker = null;
let selectedRestaurant = null;
let returnToCartAfterLocation = false;

/* ================= RESTAURANT MENUS ================= */

const menus = {
    paradise: [
        { id: "p1", name: "Chicken Dum Biryani", price: 220, image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500" },
        { id: "p2", name: "Mutton Biryani", price: 280, image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500" },
        { id: "p3", name: "Chicken Fry Piece Biryani", price: 250, image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500" }
    ],

    pizza: [
        { id: "pi1", name: "Margherita Pizza", price: 199, image: "https://images.unsplash.com/photo-1579751626657-72bc17010498?w=500" },
        { id: "pi2", name: "Farmhouse Pizza", price: 279, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500" },
        { id: "pi3", name: "Cheese Burst Pizza", price: 299, image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500" }
    ],

    burger: [
        { id: "b1", name: "Classic Burger", price: 129, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500" },
        { id: "b2", name: "Cheese Burger", price: 159, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500" },
        { id: "b3", name: "Chicken Burger", price: 189, image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500" }
    ],

    sweet: [
        { id: "s1", name: "Chocolate Cake", price: 120, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500" },
        { id: "s2", name: "Brownie", price: 100, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500" },
        { id: "s3", name: "Cupcake", price: 80, image: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=500" }
    ],

    chicken: [
        { id: "c1", name: "Grilled Chicken", price: 250, image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=500" },
        { id: "c2", name: "Chicken Wings", price: 180, image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=500" },
        { id: "c3", name: "Chicken Lollipop", price: 200, image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500" }
    ],

    royal: [
        { id: "r1", name: "Royal Chicken Biryani", price: 240, image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500" },
        { id: "r2", name: "Mutton Biryani", price: 290, image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500" },
        { id: "r3", name: "Egg Biryani", price: 170, image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500" }
    ],

    "south-spice": [
        { id: "ss1", name: "Masala Dosa", price: 80, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500" },
        { id: "ss2", name: "Idli Sambar", price: 60, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500" },
        { id: "ss3", name: "Pesarattu", price: 90, image: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=500" }
    ],

    "chinese-wok": [
        { id: "cw1", name: "Veg Noodles", price: 130, image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500" },
        { id: "cw2", name: "Chicken Noodles", price: 170, image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500" },
        { id: "cw3", name: "Schezwan Noodles", price: 160, image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500" }
    ],

    "rolls-wraps": [
        { id: "rw1", name: "Chicken Roll", price: 120, image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500" },
        { id: "rw2", name: "Paneer Roll", price: 110, image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500" },
        { id: "rw3", name: "Egg Roll", price: 90, image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500" }
    ],

    "kebab-junction": [
        { id: "kj1", name: "Chicken Kebab", price: 200, image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500" },
        { id: "kj2", name: "Seekh Kebab", price: 220, image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500" },
        { id: "kj3", name: "Tandoori Kebab", price: 240, image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500" }
    ],

    "coffee-house": [
        { id: "ch1", name: "Cold Coffee", price: 100, image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500" },
        { id: "ch2", name: "Cappuccino", price: 120, image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500" },
        { id: "ch3", name: "Chocolate Shake", price: 140, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500" }
    ],

    "italian-kitchen": [
        { id: "ik1", name: "Pasta Alfredo", price: 220, image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=500" },
        { id: "ik2", name: "Red Sauce Pasta", price: 200, image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500" },
        { id: "ik3", name: "Cheese Pizza", price: 250, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500" }
    ],

    "sandwich-station": [
        { id: "sw1", name: "Veg Sandwich", price: 90, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500" },
        { id: "sw2", name: "Cheese Sandwich", price: 120, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500" },
        { id: "sw3", name: "Chicken Sandwich", price: 150, image: "https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=500" }
    ],

    "ocean-seafood": [
        { id: "os1", name: "Fish Fry", price: 250, image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500" },
        { id: "os2", name: "Prawn Fry", price: 280, image: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=500" },
        { id: "os3", name: "Fish Curry", price: 230, image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500" }
    ],

    "thali-house": [
        { id: "th1", name: "Veg Thali", price: 150, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500" },
        { id: "th2", name: "South Indian Thali", price: 180, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500" },
        { id: "th3", name: "Special Thali", price: 220, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500" }
    ],

    "momo-street": [
        { id: "ms1", name: "Veg Momos", price: 100, image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500" },
        { id: "ms2", name: "Chicken Momos", price: 130, image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500" },
        { id: "ms3", name: "Fried Momos", price: 140, image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500" }
    ],

    "shawarma-point": [
        { id: "sp1", name: "Chicken Shawarma", price: 130, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500" },
        { id: "sp2", name: "Special Shawarma", price: 160, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500" },
        { id: "sp3", name: "Plate Shawarma", price: 190, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500" }
    ],

    "fresh-bake": [
        { id: "fb1", name: "Chocolate Cake", price: 120, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500" },
        { id: "fb2", name: "Donut", price: 70, image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500" },
        { id: "fb3", name: "Croissant", price: 90, image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500" }
    ],

    "ice-cream-world": [
        { id: "iw1", name: "Vanilla Ice Cream", price: 80, image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500" },
        { id: "iw2", name: "Chocolate Ice Cream", price: 100, image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500" },
        { id: "iw3", name: "Strawberry Ice Cream", price: 110, image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500" }
    ],

    "street-food": [
        { id: "sf1", name: "Pani Puri", price: 50, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500" },
        { id: "sf2", name: "Pav Bhaji", price: 100, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500" },
        { id: "sf3", name: "Samosa", price: 30, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500" }
    ],

    "healthy-bowl": [
        { id: "hb1", name: "Veg Salad Bowl", price: 140, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500" },
        { id: "hb2", name: "Chicken Bowl", price: 190, image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=500" },
        { id: "hb3", name: "Fruit Bowl", price: 120, image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=500" }
    ],

    "tandoori-house": [
        { id: "ta1", name: "Tandoori Chicken", price: 280, image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500" },
        { id: "ta2", name: "Chicken Tikka", price: 220, image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500" },
        { id: "ta3", name: "Paneer Tikka", price: 190, image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500" }
    ],

    "noodle-express": [
        { id: "ne1", name: "Hakka Noodles", price: 140, image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500" },
        { id: "ne2", name: "Chicken Noodles", price: 180, image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500" },
        { id: "ne3", name: "Schezwan Noodles", price: 160, image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500" }
    ]
};

/* ================= FOOD DESCRIPTIONS ================= */

const foodDescriptions = {
    p1: "Aromatic basmati rice cooked with tender chicken and traditional spices.",
    p2: "Rich mutton biryani prepared with fragrant basmati rice.",
    p3: "Spicy fried chicken served with aromatic biryani rice.",
    pi1: "Classic Italian pizza topped with mozzarella and tomato sauce.",
    pi2: "Pizza loaded with fresh vegetables and melted cheese.",
    pi3: "Delicious pizza with a creamy cheese-filled crust.",
    b1: "Classic burger with a juicy patty and fresh vegetables.",
    b2: "Cheese-filled burger with a crispy patty and creamy sauce.",
    b3: "Juicy chicken patty with fresh vegetables and burger sauce.",
    s1: "Soft chocolate cake with rich chocolate cream.",
    s2: "Warm and fudgy chocolate brownie.",
    s3: "Soft cupcake topped with creamy frosting.",
    c1: "Tender chicken grilled with herbs and seasoning.",
    c2: "Juicy chicken wings coated in a flavourful marinade.",
    c3: "Crispy chicken lollipops with delicious dipping sauce.",
    r1: "Fragrant royal chicken biryani with rich spices and raita.",
    r2: "Slow-cooked mutton biryani layered with saffron rice.",
    r3: "Spiced egg biryani served with flavorful masala gravy.",
    ss1: "Crispy golden dosa stuffed with spiced potato masala.",
    ss2: "Steamed soft idlis served with hot lentil sambar and chutney.",
    ss3: "Wholesome green gram dosa served with ginger chutney.",
    cw1: "Wok-tossed noodles with crisp vegetables and soy seasoning.",
    cw2: "Stir-fried noodles tossed with tender chicken and veggies.",
    cw3: "Fiery schezwan-style noodles with bold chili flavors.",
    rw1: "Soft paratha wrap filled with spiced shredded chicken.",
    rw2: "Flaky wrap stuffed with paneer cubes and tangy sauces.",
    rw3: "Warm wrap rolled with spiced egg and onions.",
    kj1: "Char-grilled chicken skewers marinated with aromatic spices.",
    kj2: "Juicy minced meat seekh kebabs cooked over charcoal.",
    kj3: "Classic tandoori-spiced kebabs roasted to perfection.",
    ch1: "Chilled blended coffee topped with frothy milk.",
    ch2: "Rich espresso topped with steamed milk and velvety foam.",
    ch3: "Thick and creamy chocolate milkshake.",
    ik1: "Pasta tossed in a creamy parmesan and garlic Alfredo sauce.",
    ik2: "Pasta simmered in a tangy herb tomato sauce.",
    ik3: "Oven-baked pizza loaded with bubbling cheese.",
    sw1: "Freshly toasted sandwich layered with crisp vegetables.",
    sw2: "Melted cheese sandwich grilled until golden brown.",
    sw3: "Savory chicken sandwich with fresh greens and spread.",
    os1: "Crispy pan-fried fish marinated with coastal spices.",
    os2: "Golden-fried prawns seasoned with garlic and pepper.",
    os3: " homestyle fish curry simmered in spiced gravy.",
    th1: "Balanced vegetarian meal with dal, sabzi, roti, rice, and sweet.",
    th2: "Traditional South Indian meal with rice, sambar, rasam, and curries.",
    th3: "Grand thali assortment with extra curries, breads, and dessert.",
    ms1: "Steamed dumplings filled with seasoned mixed vegetables.",
    ms2: "Juicy dumplings stuffed with spiced minced chicken.",
    ms3: "Crisp fried momos served with spicy chili chutney.",
    sp1: "Roasted chicken wrapped with garlic mayo and pickles.",
    sp2: "Loaded shawarma wrap with extra chicken and cheese.",
    sp3: "Platter-style shawarma served with dips, fries, and bread.",
    fb1: "Moist chocolate cake slice with smooth ganache.",
    fb2: "Soft glazed ring donut freshly baked in-house.",
    fb3: "Flaky, buttery French-style croissant.",
    iw1: "Classic smooth vanilla bean ice cream scoop.",
    iw2: "Rich cocoa ice cream made for chocolate lovers.",
    iw3: "Sweet and fruity strawberry ice cream scoop.",
    sf1: "Crispy puris served with tangy mint- tamarind water.",
    sf2: "Spiced vegetable mash served with buttered pav.",
    sf3: "Crispy golden samosa stuffed with spiced potatoes.",
    hb1: "Fresh garden salad bowl with greens, grains, and vinaigrette.",
    hb2: "Protein-packed bowl with grilled chicken and wholesome sides.",
    hb3: "Assorted fresh seasonal fruits cut to order.",
    ta1: "Clay-oven roasted chicken marinated in yogurt and spices.",
    ta2: "Charred chicken tikka pieces with smoky spice notes.",
    ta3: "Tandoor-roasted paneer cubes with bell peppers and spices.",
    ne1: "Classic Indo-Chinese Hakka noodles tossed on high flame.",
    ne2: "Savory chicken noodles cooked with spring onions and sauces.",
    ne3: "Spicy schezwan noodles packed with wok-charred flavor."
};

/* ================= HELPERS ================= */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function money(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN");
}

function getRestaurant(restaurantId) {
    return document.querySelector(
        `.restaurant-card[data-id="${CSS.escape(restaurantId)}"]`
    );
}

function scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showFooter() {
    if (footer) footer.style.display = "block";
}

function hideFooter() {
    if (footer) footer.style.display = "none";
}

function showLocationStatus(message, isError = false) {
    const card = document.querySelector(".selected-location-card");
    if (!card) return;

    let statusEl = $("locationStatusMessage");
    if (!statusEl) {
        statusEl = document.createElement("p");
        statusEl.id = "locationStatusMessage";
        statusEl.style.marginTop = "10px";
        statusEl.style.fontSize = "12.5px";
        statusEl.style.fontWeight = "700";
        card.appendChild(statusEl);
    }

    statusEl.textContent = message;
    statusEl.style.color = isError ? "var(--danger, #d93636)" : "var(--success, #178b50)";
}

/* ================= PAGE NAVIGATION ================= */

function hideAllPages() {
    [homePage, menuPage, profilePage, foodLocationSection].forEach(page => {
        if (page) {
            page.hidden = true;
            page.style.display = "none";
        }
    });
}

function setActiveLink(activeLink) {
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active");
    });

    if (activeLink) activeLink.classList.add("active");
}

function showHome() {
    hideAllPages();
    showFooter();

    if (homePage) {
        homePage.hidden = false;
        homePage.style.display = "block";
    }

    setActiveLink(homeLink);
    scrollTop();
}

function showRestaurants() {
    hideAllPages();
    showFooter();

    if (homePage) {
        homePage.hidden = false;
        homePage.style.display = "block";
    }

    setActiveLink(restaurantLink);

    $("restaurantsSection")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function showCategories() {
    hideAllPages();
    showFooter();

    if (homePage) {
        homePage.hidden = false;
        homePage.style.display = "block";
    }

    setActiveLink(categoryLink);

    $("categoriesSection")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function showProfile() {
    hideAllPages();
    showFooter();

    if (!profilePage) return;

    profilePage.hidden = false;
    profilePage.style.display = "block";

    setActiveLink(profileLink);
    updateProfile();
    scrollTop();
}

function showMenu(restaurantId) {
    const restaurant = getRestaurant(restaurantId);
    if (!restaurant) return;

    selectedRestaurant = {
        id: restaurantId,
        name: restaurant.dataset.name || "Restaurant"
    };

    hideAllPages();
    showFooter();

    if (menuPage) {
        menuPage.hidden = false;
        menuPage.style.display = "block";
    }

    const title = $("menuRestaurantName");
    if (title) title.textContent = selectedRestaurant.name;

    renderMenu(restaurantId);
    scrollTop();
}

function showLocation(fromCart = false) {
    returnToCartAfterLocation = fromCart;

    hideAllPages();
    hideFooter();

    if (!foodLocationSection) return;

    foodLocationSection.hidden = false;
    foodLocationSection.style.display = "block";

    foodLocationSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    setTimeout(() => {
        if (!foodKartMap) {
            const saved = getSavedLocation();

            initializeMap(
                saved?.latitude ?? DEFAULT_LATITUDE,
                saved?.longitude ?? DEFAULT_LONGITUDE,
                saved?.name ?? "Warangal"
            );
        } else {
            foodKartMap.invalidateSize(true);
        }
    }, 300);
}

/* ================= NAVIGATION EVENTS ================= */

logoLink?.addEventListener("click", event => {
    event.preventDefault();
    filterRestaurants("all");
    showHome();
});

homeLink?.addEventListener("click", event => {
    event.preventDefault();
    filterRestaurants("all");
    showHome();
});

restaurantLink?.addEventListener("click", event => {
    event.preventDefault();
    showRestaurants();
});

categoryLink?.addEventListener("click", event => {
    event.preventDefault();
    showCategories();
});

profileLink?.addEventListener("click", event => {
    event.preventDefault();
    showProfile();
});

backToRestaurants?.addEventListener("click", showRestaurants);

$("footerHomeLink")?.addEventListener("click", event => {
    event.preventDefault();
    filterRestaurants("all");
    showHome();
});

$("footerRestaurantLink")?.addEventListener("click", event => {
    event.preventDefault();
    showRestaurants();
});

$("footerProfileLink")?.addEventListener("click", event => {
    event.preventDefault();
    showProfile();
});

/* ================= RESTAURANT CLICK ================= */

restaurantGrid?.addEventListener("click", event => {
    const card = event.target.closest(".restaurant-card");
    if (card) showMenu(card.dataset.id);
});

/* ================= CATEGORY FILTER ================= */

function filterRestaurants(category) {
    const selected = String(category || "all").toLowerCase();

    document.querySelectorAll(".restaurant-card").forEach(card => {
        const categories = (card.dataset.category || "")
            .toLowerCase()
            .split(/\s+/);

        card.style.display =
            selected === "all" || categories.includes(selected)
                ? ""
                : "none";
    });

    document.querySelectorAll(".category-card").forEach(card => {
        card.classList.toggle(
            "active",
            card.dataset.category === selected
        );
    });
}

document.querySelectorAll(".category-card").forEach(category => {
    category.addEventListener("click", () => {
        filterRestaurants(category.dataset.category);
        showRestaurants();
    });
});

/* ================= CATEGORY LEFT / RIGHT SLIDER ================= */

function initializeCategorySlider() {
    const categoryList = $("categoryList");
    const leftButton = $("categoryLeft");
    const rightButton = $("categoryRight");

    if (!categoryList || !leftButton || !rightButton) {
        return;
    }

    function getScrollAmount() {
        const firstCard = categoryList.querySelector(".category-card");
        if (!firstCard) {
            return categoryList.clientWidth * 0.8;
        }

        const cardWidth = firstCard.getBoundingClientRect().width;
        const styles = window.getComputedStyle(categoryList);
        const gap = parseFloat(styles.columnGap || styles.gap) || 0;

        return (cardWidth + gap) * 3;
    }

    function updateCategoryArrows() {
        const maxScroll = categoryList.scrollWidth - categoryList.clientWidth;
        const hasOverflow = maxScroll > 2;

        leftButton.style.visibility = hasOverflow ? "visible" : "hidden";
        rightButton.style.visibility = hasOverflow ? "visible" : "hidden";

        leftButton.disabled = !hasOverflow || categoryList.scrollLeft <= 2;
        rightButton.disabled = !hasOverflow || categoryList.scrollLeft >= maxScroll - 2;
    }

    leftButton.addEventListener("click", () => {
        categoryList.scrollBy({
            left: -getScrollAmount(),
            behavior: "smooth"
        });
    });

    rightButton.addEventListener("click", () => {
        categoryList.scrollBy({
            left: getScrollAmount(),
            behavior: "smooth"
        });
    });

    categoryList.addEventListener("scroll", updateCategoryArrows);
    window.addEventListener("resize", updateCategoryArrows);
    window.addEventListener("load", updateCategoryArrows);

    updateCategoryArrows();
    requestAnimationFrame(updateCategoryArrows);
}

/* ================= SEARCH ================= */

function findSearchResults(query) {
    const results = [];

    document.querySelectorAll(".restaurant-card").forEach(card => {
        const name = card.dataset.name || "";
        const category = card.dataset.category || "";
        const restaurantId = card.dataset.id;

        if (
            name.toLowerCase().includes(query) ||
            category.toLowerCase().includes(query)
        ) {
            results.push({
                name,
                image: card.querySelector("img")?.src || "",
                restaurantId,
                type: "restaurant"
            });
        }
    });

    Object.entries(menus).forEach(([restaurantId, items]) => {
        items.forEach(item => {
            if (item.name.toLowerCase().includes(query)) {
                results.push({
                    name: item.name,
                    image: item.image,
                    restaurantId,
                    type: "food"
                });
            }
        });
    });

    return results.slice(0, 10);
}

function displaySuggestions(results) {
    if (!searchSuggestions) return;

    searchSuggestions.innerHTML = "";

    if (!results.length) {
        searchSuggestions.style.display = "none";
        return;
    }

    results.forEach(item => {
        const option = document.createElement("div");
        option.className = "search-suggestion-item";

        const image = document.createElement("img");
        image.src = item.image;
        image.alt = item.name;

        const details = document.createElement("div");
        const name = document.createElement("h4");
        name.textContent = item.name;

        const meta = document.createElement("p");
        meta.textContent = item.type === "restaurant" ? "Restaurant" : "Food Item";

        details.append(name, meta);
        option.append(image, details);

        option.addEventListener("click", () => {
            if (searchInput) searchInput.value = item.name;
            searchSuggestions.style.display = "none";
            filterRestaurants("all");
            showMenu(item.restaurantId);
        });

        searchSuggestions.appendChild(option);
    });

    searchSuggestions.style.display = "block";
}

function performSearch() {
    const query = searchInput?.value.trim().toLowerCase();

    if (!query) {
        filterRestaurants("all");
        if (searchSuggestions) searchSuggestions.style.display = "none";
        showRestaurants();
        return;
    }

    const results = findSearchResults(query);

    document.querySelectorAll(".restaurant-card").forEach(card => {
        const name = (card.dataset.name || "").toLowerCase();
        const category = (card.dataset.category || "").toLowerCase();
        const id = card.dataset.id;

        const matchingFood = (menus[id] || []).some(item =>
            item.name.toLowerCase().includes(query)
        );

        card.style.display =
            name.includes(query) ||
            category.includes(query) ||
            matchingFood
                ? ""
                : "none";
    });

    if (searchSuggestions) searchSuggestions.style.display = "none";
    showRestaurants();

    if (!results.length) {
        alert("No matching restaurants or food items found.");
    }
}

searchInput?.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();

    if (!query) {
        if (searchSuggestions) searchSuggestions.style.display = "none";
        filterRestaurants("all");
        return;
    }

    displaySuggestions(findSearchResults(query));
});

searchButton?.addEventListener("click", performSearch);

searchInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        performSearch();
    }
});

document.addEventListener("click", event => {
    if (
        searchSuggestions &&
        !event.target.closest(".hero-search")
    ) {
        searchSuggestions.style.display = "none";
    }
});

/* ================= CART STORAGE ================= */

let cart = [];

try {
    const savedCart = JSON.parse(
        localStorage.getItem("foodkart_cart") || "[]"
    );

    cart = Array.isArray(savedCart) ? savedCart : [];
} catch {
    cart = [];
}

/* ================= CART LOGIN CHECK ================= */

function isUserLoggedIn() {
    return Boolean(document.querySelector(".account-layout"));
}

function redirectToLogin() {
    const loginLink = document.querySelector(
        '.profile-container a[href*="login"], a.profile-login-btn'
    );

    alert("Please login to access your cart.");

    if (loginLink) {
        window.location.href = loginLink.href;
    } else {
        window.location.href = "/login/";
    }
}

/* ================= MENU RENDERING ================= */

function renderMenu(restaurantId) {
    if (!menuGrid) return;

    const items = menus[restaurantId] || [];

    if (!items.length) {
        menuGrid.innerHTML = "<p>No menu items available.</p>";
        return;
    }

    menuGrid.innerHTML = items.map(item => {
        const existing = cart.find(food =>
            String(food.id) === String(item.id) &&
            String(food.restaurantId) === String(restaurantId)
        );

        const quantity = Number(existing?.quantity || 0);
        const added = quantity > 0;

        return `
            <article class="menu-card">
                <div class="menu-image">
                    <img
                        src="${escapeHTML(item.image)}"
                        alt="${escapeHTML(item.name)}"
                        loading="lazy"
                    >
                </div>

                <div class="menu-details">
                    <h3>${escapeHTML(item.name)}</h3>

                    <p class="menu-description">
                        ${escapeHTML(
                            foodDescriptions[item.id] ||
                            "Freshly prepared and delicious food."
                        )}
                    </p>

                    <div class="menu-bottom-row">
                        <div class="menu-price">
                            ${money(item.price)}
                        </div>

                        <div class="menu-actions">
                            <button
                                type="button"
                                class="add-to-cart"
                                data-id="${escapeHTML(String(item.id))}"
                                ${added ? "hidden" : ""}
                            >
                                <i class="fa-solid fa-plus"></i> Add
                            </button>

                            <div
                                class="menu-quantity"
                                ${added ? "" : "hidden"}
                            >
                                <button
                                    type="button"
                                    class="menu-decrease"
                                    data-id="${escapeHTML(String(item.id))}"
                                    aria-label="Decrease quantity"
                                >−</button>

                                <span class="menu-quantity-value">
                                    ${quantity}
                                </span>

                                <button
                                    type="button"
                                    class="menu-increase"
                                    data-id="${escapeHTML(String(item.id))}"
                                    aria-label="Increase quantity"
                                >+</button>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

/* ================= CART STORAGE HELPERS ================= */

function saveCart() {
    localStorage.setItem("foodkart_cart", JSON.stringify(cart));
}

function updateCart() {
    const totalQuantity = cart.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
    );

    if ($("cartCount")) {
        $("cartCount").textContent = totalQuantity;
    }

    const checkoutButton = $("checkoutButton");
    if (checkoutButton) {
        checkoutButton.disabled = cart.length === 0;
    }

    renderCart();
    calculateCartTotal();
    updateCartLocation();
}

/* ================= ADD TO CART ================= */

function addToCart(itemId) {
    if (!isUserLoggedIn()) {
        redirectToLogin();
        return;
    }

    if (!selectedRestaurant) return;

    const restaurantId = selectedRestaurant.id;
    const item = (menus[restaurantId] || []).find(food =>
        String(food.id) === String(itemId)
    );

    if (!item) {
        console.error("Menu item not found:", itemId);
        return;
    }

    const differentRestaurant = cart.some(food =>
        String(food.restaurantId) !== String(restaurantId)
    );

    if (differentRestaurant) {
        const previousRestaurant =
            cart[0]?.restaurantName || "another restaurant";

        const confirmChange = confirm(
            `Your cart contains items from ${previousRestaurant}.\n\n` +
            `Do you want to clear your cart and add items from ${selectedRestaurant.name}?`
        );

        if (!confirmChange) return;

        cart = [];
    }

    const existing = cart.find(food =>
        String(food.id) === String(item.id) &&
        String(food.restaurantId) === String(restaurantId)
    );

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            restaurantId,
            restaurantName: selectedRestaurant.name,
            quantity: 1
        });
    }

    saveCart();
    updateCart();
    renderMenu(restaurantId);
}

/* ================= MENU BUTTON EVENTS ================= */

menuGrid?.addEventListener("click", event => {
    const addButton = event.target.closest(".add-to-cart");
    const increaseButton = event.target.closest(".menu-increase");
    const decreaseButton = event.target.closest(".menu-decrease");

    if (addButton) {
        addToCart(addButton.dataset.id);
        return;
    }

    const button = increaseButton || decreaseButton;
    if (!button || !selectedRestaurant) return;

    if (!isUserLoggedIn()) {
        redirectToLogin();
        return;
    }

    const item = cart.find(food =>
        String(food.id) === String(button.dataset.id) &&
        String(food.restaurantId) === String(selectedRestaurant.id)
    );

    if (!item) return;

    if (increaseButton) {
        item.quantity++;
    }

    if (decreaseButton) {
        item.quantity--;
        if (item.quantity <= 0) {
            cart = cart.filter(food => food !== item);
        }
    }

    saveCart();
    updateCart();
    renderMenu(selectedRestaurant.id);
});

/* ================= CART DISPLAY ================= */

function renderCart() {
    const cartItems = $("cartItems");
    if (!cartItems) return;

    if (!cart.length) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fa-solid fa-basket-shopping"></i>
                <h3>Your cart is empty</h3>
                <p>Add some delicious food!</p>
            </div>
        `;
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${escapeHTML(item.image)}"
                 alt="${escapeHTML(item.name)}"
                 loading="lazy">

            <div class="cart-item-details">
                <h4>${escapeHTML(item.name)}</h4>
                <p>${escapeHTML(item.restaurantName)}</p>

                <strong>
                    ${money(item.price * item.quantity)}
                </strong>

                <div class="cart-quantity">
                    <button type="button"
                            data-action="decrease"
                            data-id="${escapeHTML(String(item.id))}"
                            data-restaurant="${escapeHTML(String(item.restaurantId))}">−</button>

                    <span>${item.quantity}</span>

                    <button type="button"
                            data-action="increase"
                            data-id="${escapeHTML(String(item.id))}"
                            data-restaurant="${escapeHTML(String(item.restaurantId))}">+</button>
                </div>
            </div>

            <button type="button"
                    class="remove-cart-item"
                    data-action="remove"
                    data-id="${escapeHTML(String(item.id))}"
                    data-restaurant="${escapeHTML(String(item.restaurantId))}">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join("");
}

/* ================= CART QUANTITY EVENTS ================= */

$("cartItems")?.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    if (!isUserLoggedIn()) {
        redirectToLogin();
        return;
    }

    const item = cart.find(food =>
        String(food.id) === String(button.dataset.id) &&
        String(food.restaurantId) === String(button.dataset.restaurant)
    );

    if (!item) return;

    const action = button.dataset.action;

    if (action === "increase") {
        item.quantity++;
    } else if (action === "decrease") {
        item.quantity--;
        if (item.quantity <= 0) {
            cart = cart.filter(food => food !== item);
        }
    } else if (action === "remove") {
        cart = cart.filter(food => food !== item);
    }

    saveCart();
    updateCart();

    if (selectedRestaurant) {
        renderMenu(selectedRestaurant.id);
    }
});

/* ================= CART TOTAL ================= */

function calculateCartTotal() {
    const itemTotal = cart.reduce(
        (total, item) =>
            total + Number(item.price) * Number(item.quantity),
        0
    );

    const deliveryFee = itemTotal > 0 ? DELIVERY_FEE : 0;
    const platformFee = itemTotal > 0 ? PLATFORM_FEE : 0;
    const grandTotal = itemTotal + deliveryFee + platformFee;

    if ($("itemTotal")) $("itemTotal").textContent = money(itemTotal);
    if ($("deliveryFee")) $("deliveryFee").textContent = money(deliveryFee);
    if ($("platformFee")) $("platformFee").textContent = money(platformFee);
    if ($("grandTotal")) $("grandTotal").textContent = money(grandTotal);
}

/* ================= CART DRAWER ================= */

function openCartDrawer() {
    updateCartLocation();
    cartDrawer?.classList.add("active");
    cartOverlay?.classList.add("active");
}

function closeCartDrawer() {
    cartDrawer?.classList.remove("active");
    cartOverlay?.classList.remove("active");
}

cartButton?.addEventListener("click", event => {
    event.preventDefault();

    if (!isUserLoggedIn()) {
        redirectToLogin();
        return;
    }

    openCartDrawer();
});

closeCart?.addEventListener("click", closeCartDrawer);
cartOverlay?.addEventListener("click", closeCartDrawer);

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeCartDrawer();
    }
});

/* ================= DJANGO CSRF TOKEN ================= */

function getCSRFToken() {
    const cookie = document.cookie
        .split("; ")
        .find(row => row.startsWith("csrftoken="));

    if (cookie) {
        return decodeURIComponent(cookie.split("=")[1]);
    }

    return document.querySelector(
        '[name="csrfmiddlewaretoken"]'
    )?.value || "";
}

/* ================= SAVE DELIVERY ADDRESS ================= */

$("saveSelectedAddressButton")?.addEventListener("click", async () => {
    const button = $("saveSelectedAddressButton");
    const location = getSavedLocation();
    const addressType = $("savedAddressType")?.value || "Home";
    const csrfToken = getCSRFToken();

    if (!location || !location.name) {
        showLocationStatus("Please select a location first.", true);
        return;
    }

    if (
        !Number.isFinite(Number(location.latitude)) ||
        !Number.isFinite(Number(location.longitude))
    ) {
        showLocationStatus("Please select a valid location on the map.", true);
        return;
    }

    if (!csrfToken) {
        showLocationStatus("Security token missing. Please refresh the page.", true);
        return;
    }

    const originalText = button.innerHTML;

    try {
        button.disabled = true;
        button.textContent = "Saving...";

        const response = await fetch(button.dataset.saveUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken
            },
            credentials: "same-origin",
            body: JSON.stringify({
                address: location.name,
                address_type: addressType,
                latitude: Number(location.latitude),
                longitude: Number(location.longitude)
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to save address.");
        }

        showLocationStatus("Address saved successfully!");
        window.location.reload();
    } catch (error) {
        console.error("Save address error:", error);
        showLocationStatus(error.message || "Something went wrong.", true);
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
});

/* ================= CHECKOUT ================= */

$("checkoutButton")?.addEventListener("click", async () => {
    const checkoutButton = $("checkoutButton");
    const originalButtonText = checkoutButton.textContent;

    if (!cart.length) {
        alert("Your cart is empty!");
        return;
    }

    if (!isUserLoggedIn()) {
        redirectToLogin();
        return;
    }

    const location = getSavedLocation();

    if (!location) {
        alert("Please select your delivery location first.");
        closeCartDrawer();
        showLocation(true);
        return;
    }

    if (
        !Number.isFinite(Number(location.latitude)) ||
        !Number.isFinite(Number(location.longitude))
    ) {
        alert("Please select a valid delivery location.");
        return;
    }

    const csrfToken = getCSRFToken();
    if (!csrfToken) {
        alert("Security token missing. Please refresh the page.");
        return;
    }

    const itemTotal = cart.reduce(
        (total, item) =>
            total + Number(item.price) * Number(item.quantity),
        0
    );

    const grandTotal = itemTotal + DELIVERY_FEE + PLATFORM_FEE;

    const orderData = {
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity),
            image: item.image,
            restaurantId: item.restaurantId,
            restaurantName: item.restaurantName
        })),
        total: grandTotal,
        delivery_address: location.name,
        latitude: Number(location.latitude),
        longitude: Number(location.longitude)
    };

    try {
        checkoutButton.disabled = true;
        checkoutButton.textContent = "Placing Order...";

        const response = await fetch("/place-order/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken
            },
            credentials: "same-origin",
            body: JSON.stringify(orderData)
        });

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            throw new Error(
                "Server returned an unexpected response. Please login again or refresh the page."
            );
        }

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to place your order.");
        }

        cart = [];
        saveCart();
        updateCart();
        closeCartDrawer();

        alert(
            "Order placed successfully!\n\n" +
            "Order ID: " + result.order_id
        );

        window.location.reload();
    } catch (error) {
        console.error("Checkout error:", error);
        alert(error.message || "Something went wrong. Please try again.");
    } finally {
        checkoutButton.disabled = cart.length === 0;
        checkoutButton.textContent = originalButtonText;
    }
});

/* ================= LOCATION STORAGE ================= */

function getSavedLocation() {
    try {
        return JSON.parse(
            localStorage.getItem("foodkart_location") || "null"
        );
    } catch {
        return null;
    }
}

function saveLocation(name, latitude, longitude) {
    const location = {
        name,
        latitude: Number(latitude),
        longitude: Number(longitude)
    };

    localStorage.setItem(
        "foodkart_location",
        JSON.stringify(location)
    );

    if (navLocationText) {
        navLocationText.textContent = name.split(",")[0];
    }

    if (selectedLocationText) {
        selectedLocationText.textContent = name;
    }

    updateCartLocation();

    if (returnToCartAfterLocation && cart.length) {
        returnToCartAfterLocation = false;
        closeCartDrawer();
        setTimeout(openCartDrawer, 300);
    }
}

function updateCartLocation() {
    const locationButton = $("cartLocationButton");
    const locationDisplay = $("cartLocationDisplay");
    const addressText = $("cartAddressText");

    const location = getSavedLocation();

    if (location?.name) {
        if (locationButton) locationButton.style.display = "none";
        if (locationDisplay) locationDisplay.style.display = "";
        if (addressText) addressText.textContent = location.name;
    } else {
        if (locationButton) locationButton.style.display = "flex";
        if (locationDisplay) locationDisplay.style.display = "none";
    }
}

$("cartLocationButton")?.addEventListener("click", () => {
    closeCartDrawer();
    showLocation(true);
});

/* ================= LEAFLET MAP ================= */

async function reverseGeocode(latitude, longitude) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
        );

        if (response.ok) {
            const data = await response.json();
            if (data.display_name) {
                return data.display_name
                    .split(",")
                    .slice(0, 4)
                    .join(",")
                    .trim();
            }
        }
    } catch (error) {
        console.error("Address lookup failed:", error);
    }

    return `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`;
}

function initializeMap(latitude, longitude, locationName = "Selected Location") {
    const mapElement = $("foodKartMap");

    if (!mapElement || typeof L === "undefined") {
        console.error("Leaflet or map element is missing.");
        return;
    }

    if (!foodKartMap) {
        foodKartMap = L.map(mapElement).setView(
            [latitude, longitude],
            13
        );

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution: "&copy; OpenStreetMap contributors",
                maxZoom: 19
            }
        ).addTo(foodKartMap);

        foodKartMap.on("click", async event => {
            const { lat, lng } = event.latlng;
            const resolvedName = await reverseGeocode(lat, lng);
            initializeMap(lat, lng, resolvedName);
            saveLocation(resolvedName, lat, lng);
        });
    } else {
        foodKartMap.setView([latitude, longitude], 15);
    }

    if (currentLocationMarker) {
        currentLocationMarker.setLatLng([latitude, longitude]);
    } else {
        currentLocationMarker = L.marker([latitude, longitude], {
            draggable: true
        }).addTo(foodKartMap);

        currentLocationMarker.on("dragend", async () => {
            const pos = currentLocationMarker.getLatLng();
            const resolvedName = await reverseGeocode(pos.lat, pos.lng);
            currentLocationMarker
                .bindPopup(`<strong>📍 ${escapeHTML(resolvedName)}</strong>`)
                .openPopup();
            saveLocation(resolvedName, pos.lat, pos.lng);
        });
    }

    currentLocationMarker.bindPopup(
        `<strong>📍 ${escapeHTML(locationName)}</strong>`
    );

    setTimeout(() => {
        foodKartMap.invalidateSize(true);
        currentLocationMarker.openPopup();
    }, 250);
}

/* ================= SEARCH LOCATION ================= */

async function searchLocation() {
    const query = mapSearchInput?.value.trim();

    if (!query) {
        showLocationStatus("Please enter a location.", true);
        return;
    }

    if (mapSearchButton) {
        mapSearchButton.disabled = true;
        mapSearchButton.textContent = "⏳";
    }

    try {
        const url =
            "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
            encodeURIComponent(query);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Location search failed.");
        }

        const results = await response.json();
        if (!results.length) {
            showLocationStatus("Location not found. Try another location.", true);
            return;
        }

        const result = results[0];
        const latitude = Number(result.lat);
        const longitude = Number(result.lon);
        const locationName = result.display_name
            .split(",")
            .slice(0, 4)
            .join(",")
            .trim();

        initializeMap(latitude, longitude, locationName);
        saveLocation(locationName, latitude, longitude);
        showLocationStatus("Location updated.");
    } catch (error) {
        console.error(error);
        showLocationStatus("Unable to search location. Please try again.", true);
    } finally {
        if (mapSearchButton) {
            mapSearchButton.disabled = false;
            mapSearchButton.textContent = "🔍";
        }
    }
}

mapSearchButton?.addEventListener("click", searchLocation);

mapSearchInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        searchLocation();
    }
});

/* ================= CURRENT LOCATION ================= */

function loadCurrentLocation() {
    if (!navigator.geolocation) {
        showLocationStatus("Geolocation is not supported by your browser.", true);
        return;
    }

    if (currentLocationButton) {
        currentLocationButton.disabled = true;
        currentLocationButton.textContent = "Detecting location...";
    }

    navigator.geolocation.getCurrentPosition(
        async position => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const locationName = await reverseGeocode(latitude, longitude);

            initializeMap(latitude, longitude, locationName);
            saveLocation(locationName, latitude, longitude);
            showLocationStatus("Current location detected.");

            if (currentLocationButton) {
                currentLocationButton.disabled = false;
                currentLocationButton.innerHTML =
                    '<i class="fa-solid fa-location-crosshairs"></i> Use My Current Location';
            }
        },
        error => {
            console.error("Location error:", error);
            showLocationStatus(
                "Unable to detect your location. Allow location access and try again.",
                true
            );

            if (currentLocationButton) {
                currentLocationButton.disabled = false;
                currentLocationButton.innerHTML =
                    '<i class="fa-solid fa-location-crosshairs"></i> Use My Current Location';
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}

currentLocationButton?.addEventListener("click", loadCurrentLocation);

/* ================= NAVBAR LOCATION ================= */

navLocationButton?.addEventListener("click", event => {
    event.preventDefault();
    showLocation(false);
});

/* ================= PROFILE ================= */

function updateProfile() {
    const loggedIn = Boolean(
        document.querySelector(".account-layout")
    );

    const guestSection = $("guestSection");
    const loggedInSection = $("loggedInSection");

    if (guestSection) {
        guestSection.style.display = loggedIn ? "none" : "block";
    }

    if (loggedInSection) {
        loggedInSection.style.display = loggedIn ? "block" : "none";
    }
}

/* ================= PROFILE TABS ================= */

function openProfileTab(tabId) {
    const target = $(tabId);
    if (!target) return;

    document.querySelectorAll(".account-tab").forEach(tab => {
        tab.classList.remove("active");
    });

    document.querySelectorAll(".account-nav-item").forEach(button => {
        button.classList.remove("active");
    });

    target.classList.add("active");

    document.querySelectorAll(`[data-tab="${tabId}"]`).forEach(button => {
        button.classList.add("active");
    });
}

document.querySelectorAll("[data-tab]").forEach(button => {
    button.addEventListener("click", () => {
        openProfileTab(button.dataset.tab);
    });
});

/* ================= PROFILE PHOTO ================= */

$("accountPhotoInput")?.addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        event.target.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Please select an image smaller than 5 MB.");
        event.target.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        const image = reader.result;
        if ($("accountProfileImage")) $("accountProfileImage").src = image;
        if ($("accountSidebarImage")) $("accountSidebarImage").src = image;
    };
    reader.readAsDataURL(file);
});

/* ================= DARK MODE ================= */

function applyTheme(theme) {
    const dark = theme === "dark";

    document.body.classList.toggle("dark-mode", dark);
    document.body.setAttribute("data-theme", dark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");

    const icon = $("themeIcon");
    const text = $("themeText");

    if (icon) {
        icon.className = dark
            ? "fa-solid fa-sun"
            : "fa-solid fa-moon";
    }

    if (text) {
        text.textContent = dark ? "Light Mode" : "Dark Mode";
    }

    document.querySelectorAll("#themeToggle, #settingsThemeToggle")
        .forEach(button => {
            button.setAttribute("aria-pressed", String(dark));
        });

    localStorage.setItem(
        "foodkart_theme",
        dark ? "dark" : "light"
    );
}

function toggleTheme() {
    const dark = document.body.classList.contains("dark-mode");
    applyTheme(dark ? "light" : "dark");
}

$("themeToggle")?.addEventListener("click", toggleTheme);
$("settingsThemeToggle")?.addEventListener("click", toggleTheme);

/* ================= SAVED ADDRESS ACTIONS ================= */

document.addEventListener("click", async event => {
    const deleteButton = event.target.closest(".delete-address-button");
    const defaultButton = event.target.closest(".set-default-address-button");
    const button = deleteButton || defaultButton;

    if (!button) return;

    const isDelete = Boolean(deleteButton);
    if (isDelete && !confirm("Are you sure you want to delete this address?")) {
        return;
    }

    const csrfToken = getCSRFToken();
    if (!csrfToken) {
        alert("Security token missing. Please refresh the page.");
        return;
    }

    const url = isDelete
        ? button.dataset.deleteUrl
        : button.dataset.defaultUrl;

    const originalText = button.textContent;

    try {
        button.disabled = true;
        button.textContent = isDelete ? "Deleting..." : "Updating...";

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken
            },
            credentials: "same-origin"
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to update address.");
        }

        alert(
            result.message ||
            (isDelete
                ? "Address deleted successfully."
                : "Default address updated successfully.")
        );

        window.location.reload();
    } catch (error) {
        console.error("Address action error:", error);
        alert(error.message || "Something went wrong.");
        button.disabled = false;
        button.textContent = originalText;
    }
});

/* ================= USE SAVED ADDRESS ================= */

document.addEventListener("click", event => {
    const button = event.target.closest(".use-saved-address-button");
    if (!button) return;

    const address = button.dataset.address;
    const latitude = Number(button.dataset.latitude);
    const longitude = Number(button.dataset.longitude);

    if (
        !address ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        button.dataset.latitude === "" ||
        button.dataset.longitude === ""
    ) {
        alert("This address does not have valid location coordinates.");
        return;
    }

    saveLocation(address, latitude, longitude);
    showLocationStatus("Delivery address selected successfully!");
    alert("Delivery address selected successfully!");
});

/* ================= CANCEL ORDER ================= */

const myOrdersTab = $("myOrdersTab");

myOrdersTab?.addEventListener("click", async function(event) {
    const button = event.target.closest(".cancel-order-button");
    if (!button) return;

    if (!confirm("Are you sure you want to cancel this order?")) {
        return;
    }

    const csrfToken = getCSRFToken();
    if (!csrfToken) {
        alert("Security token missing. Please refresh the page.");
        return;
    }

    button.disabled = true;
    button.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Cancelling...';

    try {
        const response = await fetch(button.dataset.cancelUrl, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken
            },
            credentials: "same-origin"
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to cancel order.");
        }

        alert(result.message);
        window.location.reload();
    } catch (error) {
        alert(error.message || "Something went wrong.");
        button.disabled = false;
        button.innerHTML =
            '<i class="fa-solid fa-xmark"></i> Cancel Order';
    }
});

/* ================= MOBILE HAMBURGER MENU ================= */

function initializeMobileMenu() {
    const navbar = document.querySelector(".navbar");
    const navToggle = $("navToggle");
    const navMenu = $("navMenu");

    if (!navbar || !navToggle || !navMenu) {
        return;
    }

    function closeMobileMenu() {
        navbar.classList.remove("menu-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Open navigation menu");
    }

    navToggle.addEventListener("click", event => {
        event.stopPropagation();

        const isOpen = navbar.classList.toggle("menu-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
        navToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu"
        );
    });

    navMenu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", closeMobileMenu);
    });

    document.addEventListener("click", event => {
        if (!navbar.contains(event.target)) {
            closeMobileMenu();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            closeMobileMenu();
        }
    });
}

/* ================= INITIAL LOAD ================= */

function initializeFoodKart() {
    const savedTheme =
        localStorage.getItem("foodkart_theme") || "light";

    applyTheme(savedTheme);

    const savedLocation = getSavedLocation();
    const defaultAddress = $("defaultAddressData");

    if (!savedLocation && defaultAddress) {
        const latitude = defaultAddress.dataset.latitude;
        const longitude = defaultAddress.dataset.longitude;
        const address = defaultAddress.dataset.address;

        if (
            address &&
            latitude !== "" &&
            longitude !== "" &&
            Number.isFinite(Number(latitude)) &&
            Number.isFinite(Number(longitude))
        ) {
            saveLocation(address, latitude, longitude);
        }
    }

    const activeLocation = getSavedLocation();

    if (activeLocation) {
        if (navLocationText) {
            navLocationText.textContent =
                activeLocation.name.split(",")[0];
        }

        if (selectedLocationText) {
            selectedLocationText.textContent = activeLocation.name;
        }
    }

    updateCart();
    updateProfile();
    showHome();

    const params = new URLSearchParams(window.location.search);

    if (params.get("show_orders") === "1") {
        showProfile();
        openProfileTab("myOrdersTab");

        window.history.replaceState(
            {},
            "",
            window.location.pathname
        );
    }

    console.log("FoodKart loaded successfully!");
}

/* ================= START FOODKART ================= */

initializeFoodKart();
initializeCategorySlider();
initializeMobileMenu();

})();