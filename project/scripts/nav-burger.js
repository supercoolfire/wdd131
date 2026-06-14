/*
* nav-burger.js
* Author: Jayser Pilapil
* Date: 2026-05-15
* Description: This script is used to toggle the navigation menu on mobile devices.
* Version: 1.0
*
* Features:
* 1. Toggle the navigation menu on mobile devices.
* 2. Change the hamburger icon to a close icon when the menu is open.
*
* Dependencies:
* 1. None
*
* Usage:
* 1. Include this script in your HTML file.
* <script src="nav-burger.js"></script>
* 2. Add the following CSS to your HTML file:
* Mobile view:

#course-title {
    display: block;
    text-align: left;
    font-family: "Ubuntu", Arial, sans-serif;
    font-weight: bold;
    font-size: 1.8rem;
    margin-left: 1rem;
    margin-top: .5rem;
    padding-bottom: 2rem;
    color: #4a3102; 
}

#menu {
    display: block;
    font-size: 2rem;
    font-weight: 700;
    text-decoration: none;
    padding: .5rem .75rem;
    background-color: #eeeeee;
    color: #000000;
    
    cursor: pointer;
	position: absolute;
	top: 1rem;
	right: 1rem;
}

#menu::before {
    content: "☰";
}

.show li {
    display: block;
}

#menu.show::before {
    content: "❌";
}
* Desktop view:
#menu {
    display: none;
}

*/

const mainnav = document.querySelector('nav');
const hambutton = document.querySelector('#menu');
const a = document.querySelectorAll('nav ul li a');

// Retract after click
a.forEach(item => {
    item.addEventListener('click', () => {
        mainnav.classList.remove('show');
        hambutton.classList.remove('show');
    });
});

hambutton.addEventListener('click', () => {
    mainnav.classList.toggle('show');
    hambutton.classList.toggle('show');
});

// Set active class on the nav link that matches the current page.
// Must run after hydration since nav links are injected by hydrate-v5.js.
const setActiveNavLink = () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav ul li a').forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
};

// Try multiple ways to ensure active nav link is set
const trySetActiveNavLink = () => {
    setActiveNavLink();
};

document.addEventListener('hydrationFinished', trySetActiveNavLink);
document.addEventListener('DOMContentLoaded', trySetActiveNavLink);

// Also try a short delay in case both events fire too early
setTimeout(trySetActiveNavLink, 100);
setTimeout(trySetActiveNavLink, 500);