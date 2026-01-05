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
        status: "Medical Emergency",
        availableForAdoption: false,
        breed: "Tabby",
        age: "2 Years",
        img: "assets/oliver_xray.jpg",
        images: [
            "assets/oliver_xray.jpg",
            "assets/oliver_xray_2.jpg"
        ],
        story: `Oliver is a survivor in the truest sense. He is a two year old giant fluffball who was found in a critical state after being shot twice, requiring immediate, life-saving surgery.
        <br><br>
        Despite his trauma, Oliver has a gentle soul. He is currently recovering in our medical wing and requires daily red light (photobiomodulation) interventions and pain management. We are determined to help him walk again and live the pain-free life he deserves.
        <br><br>
        His doctor is Markos Ktori at <a href="https://www.limassolvet.com/" target="_blank">Limassol Veterinary Clinic</a>.`,
        campaign: {
            title: "Emergency Surgery Fund",
            goal: 5000,
            raised: 1200,
            link: "campaign-oliver.html",
            text: "Help cover Oliver's surgical costs and rehabilitation."
        }
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
        status: "Medical Care",
        availableForAdoption: false,
        breed: "Domestic Short Hair",
        age: "Unknown",
        img: "assets/tillie.jpg",
        images: ["assets/tillie.jpg"],
        story: `Tillie (aka "Tillie Bird") is the fan favorite at the sanctuary. Neighbors often ask about her, as she has been a fixture here for 4 years.
        <br><br>
        She arrived with her ear already clipped, indicating she was already spayed. She walked in, made herself comfortable on the couch, and has pretty much stayed there ever since.
        <br><br>
        Currently, Tillie is in the kitty hospital suffering from acute diarrhea and chronic kidney disease. She is not available for adoption due to her medical needs, otherwise, she would make the greatest companion ever.`,
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
