# WDD 131 - Dynamic Web Fundamentals

[Live Site URL](https://supercoolfire.github.io/wdd131/)

## Welcome to my course landing page!

This project serves as my main entry point for the WDD 131: Dynamic Web Fundamentals course at BYU-Idaho. I've designed it to be more than just a static page—it's a hybrid experience that uses modern web techniques to stay flexible and data-driven.

### How I built this

I wanted this page to be clean and semantic, so I started with a core **HTML5 shell**. But instead of hardcoding everything, I implemented a **Client-Side Hydration** pattern. This means the page loads a basic layout first, then my custom script fetches a JSON file to populate all the details about me, my country, and my resources. This keeps the structure separate from the content, making it much easier for me to update things on the fly.

### The layout under the hood

I'm using a mix of **CSS Flexbox** and **CSS Grid** to ensure everything looks great on any device:
- **Mobile First**: Everything starts as a simple, readable stack.
- **Responsive Menus**: My navigation menu uses Flexbox to switch from a vertical list on your phone to a horizontal bar on your desktop.
- **Advanced Grid**: Once you view this on a larger screen, a complex CSS Grid kicks in. I've set up a 4-column layout where my "About Me" card takes center stage while my resources act as a handy sidebar.

### Dynamic Behavior

The page is "alive" and **database-ready** thanks to its modular, data-driven architecture:
- **JSON-Powered Architecture**: By decoupling the content from the structure and using an external JSON source, this site is prepared to transition to a full database or API backend with minimal code changes.
- **Hydration Logic**: My script asynchronously grabs data and injects it into the page, so you're seeing the most up-to-date information without me needing to rewrite the HTML.
- **Auto-Tracking**: I've also included a script that automatically handles the copyright year and shows exactly when I last updated the site.

This approach was actually inspired by my previous work in [CIT 230](https://byui-cit230.github.io/), where I first started exploring the power of combining data with structured layouts.

I'm excited to continue building on this foundation as I explore more "Dynamic" web fundamentals!

## How to use schema for hydrate validation in .vscode/settings.json

1. Open the `.vscode/settings.json` file in your project.
2. Add the following lines to the file:

```json
{
    "json.schemas": [
        {
            "fileMatch": ["*v4.json", "data/*v4.json"],
            "url": "https://supercoolfire.github.io/wdd131/schemas/hydrator-v4.schema.json"
        },
        {
            "fileMatch": ["*v5.json", "data/*v5.json", "*portfolio.json"],
            "url": "https://supercoolfire.github.io/wdd131/schemas/hydrator-v5.schema.json"
        }
    ]
}
```


