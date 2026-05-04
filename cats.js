const cats = {
    "splotch": {
        id: "splotch",
        name: "Splotch",
        type: "sponsor_only",
        status: "Available for Adoption",
        availableForAdoption: true,
        breed: "Red Tabby",
        age: "2 Years",
        img: "assets/splotch.jpg",
        images: [
            "assets/splotch.jpg"
        ],
        story: `Splotch is a lover, not a fighter. He is red, radiant, and can never get enough pets. 
        <br><br>
        He came to us looking for affection and has found it in abundance. If you sit down in the garden, expect Splotch to be in your lap within seconds.
        <br><br>
        <strong>Family:</strong> Father is Chester, Uncle Juniper (RIP), Grandfather Rusty. Mother is unknown.`,
        campaign: null
    },
    "toshiba": {
        id: "toshiba",
        name: "Toshiba",
        type: "adoptable",
        status: "Available for Adoption",
        availableForAdoption: true,
        breed: "Domestic Long Hair",
        age: "1 Year",
        img: "assets/toshiba.jpg",
        images: ["assets/toshiba.jpg"],
        story: `Toshiba is a handsome male cat and <a href="profile.html?id=charlie">Charlie's</a> litter-mate.
        <br><br>
        He is also the sibling of Sabrina (RIP), Eminem, and Papa Doc.`,
        campaign: null
    },
    "oliver": {
        id: "oliver",
        name: "Oliver",
        type: "sponsor_only",
        status: "In Memory",
        availableForAdoption: false,
        breed: "Tabby",
        age: "2 Years",
        img: "assets/oliver_xray.jpg",
        images: [
            "assets/oliver_xray.jpg",
            "assets/oliver_xray_2.jpg"
        ],
        story: `Oliver is remembered as a beloved regular visitor to the Gardens: a gentle giant who came for food, safety, and affection.
        <br><br>
        He survived a violent injury and received emergency veterinary care through the sanctuary's support network. We later lost Oliver under circumstances we believe involved human harm, and his page is now kept as a memorial and a record of why protection matters.
        <br><br>
        Gifts made in Oliver's memory support emergency veterinary care, protection, and prevention work for cats still at risk.`,
        campaign: null
    },
    "mittens": {
        id: "mittens",
        name: "Mittens",
        type: "adoptable",
        status: "Adoption Pending",
        availableForAdoption: true,
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
        availableForAdoption: true,
        breed: "Orange Tabby",
        age: "4 Years",
        img: "assets/hero_garden_cat.jpg",
        images: ["assets/hero_garden_cat.jpg"],
        story: "A curious explorer who loves climbing trees and chasing sunbeams. Barnaby needs a home with plenty of vertical space!",
        campaign: null
    },
    "charlie": {
        id: "charlie",
        name: "Charlie (aka Charlie Barley)",
        type: "adoptable",
        status: "Available for Adoption",
        availableForAdoption: true,
        breed: "Domestic Short Hair",
        age: "1 Year",
        img: "assets/charlie_v2.jpg",
        images: ["assets/charlie_v2.jpg"],
        story: `Charlie was found as a ~2 month old with his 4 siblings living next to a football field, being fed next to a very busy street in Germasogeia. All kittens came to the sanctuary. Siblings include Toshiba, Eminem, Papa Doc, and Sabrina (RIP).
        <br><br>
        Charlie is available for adoption, sponsorship. No known health concerns.`,
        campaign: null
    },
    "ziggy": {
        id: "ziggy",
        name: "Chili Pepper (aka Show Pony)",
        type: "sponsor_only",
        status: "Sponsorship Only",
        availableForAdoption: false,
        breed: "Orange Tabby",
        age: "3 Years",
        img: "assets/profile_ziggy.jpg",
        images: ["assets/profile_ziggy.jpg"],
        story: `Chili Pepper is the sister of Zucchini and Cucumba (RIP). 
        <br><br>
        Her nickname is "Show pony" because of her signature move: jumping like a show pony for pets. No one is really sure how to describe this, but it is adorable.
        <br><br>
        She is a spirited and loving companion looking for a forever home.`,
        campaign: null
    },
    "luna": {
        id: "luna",
        name: "Tillie (aka Tillie Bird)",
        type: "sponsor_only",
        status: "In Memory",
        availableForAdoption: false,
        breed: "Domestic Short Hair",
        age: "Unknown",
        img: "assets/tillie.jpg",
        images: ["assets/tillie.jpg"],
        story: `Tillie (aka "Tillie Bird") was a fan favorite at the sanctuary and a fixture of the Gardens for years. Neighbors asked about her, visitors remembered her, and she had a way of making herself the center of every room.
        <br><br>
        She arrived with her ear already clipped, indicating she was already spayed. She walked in, made herself comfortable on the couch, and more or less claimed it as her own.
        <br><br>
        Tillie died on January 14. Her profile remains here as a memorial to a deeply loved cat and as part of the sanctuary's living history.`,
        campaign: null
    },
    "mabel": {
        id: "mabel",
        name: "Mabel (aka Mabel Fish)",
        type: "sponsor_only",
        status: "Sponsorship Only",
        availableForAdoption: false,
        breed: "Unknown",
        age: "5-7 Years (est.)",
        img: "assets/mabel.jpg",
        images: ["assets/mabel.jpg"],
        story: `Mabel (aka "Mabel Fish") is a sweet but shy girl who showed up at our gates covered in scratches. We suspect she was a house cat who was abandoned and struggled to survive on the streets.
        <br><br>
        Her theme song is "Super Freak" (she's a very fishy girl).
        <br><br>
        She is FIV+ and very selective about her feline friends—she only gets along with Spooky. Because of her medical status and need for a very specific environment, she is not currently available for adoption but loves human company.
        <br><br>
        We can't imagine how someone could leave a sweetheart like her behind.`,
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
