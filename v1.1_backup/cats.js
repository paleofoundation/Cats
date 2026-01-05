const cats = {
    "luna": {
        id: "luna",
        name: "Luna",
        type: "sponsor_only",
        status: "Sponsorship Available",
        breed: "Domestic Short Hair",
        age: "3 Years",
        img: "assets/hero_garden_cat.jpg",
        images: [
            "assets/hero_garden_cat.jpg",
            "assets/cat_luna_2.jpg",
            "assets/cat_luna_3.jpg"
        ],
        story: `Luna has been with us for 400 days. She is misunderstood but deeply affectionate once she trusts you. 
        <br><br>
        She came to us from a hoarding situation and was very shut down. Over the last year, she has learned that hands are for petting, not hurting. She loves sunbeams, fresh catnip, and watching the birds from the safety of the garden porch.`,
        campaign: null
    },
    "oliver": {
        id: "oliver",
        name: "Oliver",
        type: "sponsor_only",
        status: "Medical Emergency",
        breed: "Tabby",
        age: "5 Years",
        img: "assets/hero_garden_cat.jpg",
        images: [
            "assets/hero_garden_cat.jpg"
        ],
        story: `Oliver is a survivor in the truest sense. He was found in a critical state after being shot, requiring immediate, life-saving surgery.
        <br><br>
        Despite his trauma, Oliver has a gentle soul. He is currently recovering in our medical wing and requires daily bandage changes and pain management. We are determined to help him walk again and live the pain-free life he deserves.`,
        campaign: {
            title: "Emergency Surgery Fund",
            goal: 5000,
            raised: 1200,
            link: "donate.html?campaign=oliver",
            text: "Help cover Oliver's surgical costs and rehabilitation."
        }
    },
    "mittens": {
        id: "mittens",
        name: "Mittens",
        type: "adoptable",
        status: "Adoption Pending",
        breed: "Tuxedo",
        age: "8 Weeks",
        img: "assets/hero_garden_cat.jpg",
        images: ["assets/hero_garden_cat.jpg"],
        story: "Mittens is a bundle of energy! Found alone in a storm drain, she has been bottle-fed by our volunteers and is now ready to find her forever home.",
        campaign: {
            title: "Kitten Season Formula",
            goal: 2000,
            raised: 300,
            link: "donate.html?campaign=kittens",
            text: "Support the care of Mittens and other kittens this season."
        }
    },
    "barnaby": {
        id: "barnaby",
        name: "Barnaby",
        type: "adoptable",
        status: "Available",
        breed: "Orange Tabby",
        age: "4 Years",
        img: "assets/hero_garden_cat.jpg",
        images: ["assets/hero_garden_cat.jpg"],
        story: "A curious explorer who loves climbing trees and chasing sunbeams. Barnaby needs a home with plenty of vertical space!",
        campaign: null
    },
    "basil": { // Added Basil based on adoptions.html
        id: "basil",
        name: "Basil",
        type: "adoptable",
        status: "Available",
        breed: "Kitten",
        age: "12 Weeks",
        img: "assets/hero_garden_cat.jpg",
        images: ["assets/hero_garden_cat.jpg"],
        story: "Basil is a spicy little sprout full of energy. He loves toy mice and wrestling with his siblings!",
        campaign: null
    }
};

// Lightbox Functionality
let currentIndex = 0;
let cardElements = [];

document.addEventListener('DOMContentLoaded', () => {
    // Collect all cards for navigation index
    cardElements = Array.from(document.querySelectorAll('.card'));
});

function openLightbox(element) {
    const lightbox = document.getElementById('lightbox');
    const lbImg = document.getElementById('lb-img');
    const lbName = document.getElementById('lb-name');
    const lbDesc = document.getElementById('lb-desc');
    const lbLink = document.getElementById('lb-profile-link');
    const card = element.closest('.card'); // Ensure we get the card if child clicked

    if (!card) return;

    // Update current index
    currentIndex = cardElements.indexOf(card);

    // Get data from attributes
    const name = card.getAttribute('data-name');
    const desc = card.getAttribute('data-desc');
    const img = card.getAttribute('data-img');
    const id = card.getAttribute('data-id');

    // Populate Modal
    lbImg.src = img;
    lbName.textContent = name;
    lbDesc.textContent = desc;
    lbLink.href = `profile.html?id=${id}`;

    // Show
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeLightbox(event) {
    if (event.target.classList.contains('lightbox') || event.target.classList.contains('close-btn')) {
        document.getElementById('lightbox').classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function changeSlide(direction, event) {
    event.stopPropagation(); // Prevent closing when clicking nav buttons

    currentIndex += direction;

    // Loop
    if (currentIndex >= cardElements.length) currentIndex = 0;
    if (currentIndex < 0) currentIndex = cardElements.length - 1;

    const nextCard = cardElements[currentIndex];

    // Trigger update (re-use open logic but without full open overhead if already open)
    openLightbox(nextCard);
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || lightbox.classList.contains('hidden')) return;

    if (e.key === 'Escape') {
        lightbox.classList.add('hidden');
        document.body.style.overflow = '';
    }
    if (e.key === 'ArrowLeft') changeSlide(-1, { stopPropagation: () => { } });
    if (e.key === 'ArrowRight') changeSlide(1, { stopPropagation: () => { } });
});
