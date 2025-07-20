document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let gameState = {}; // Stores flags like "visited_park", "has_key", etc.

    // --- DOM ELEMENTS ---
    const themeSwitcher = document.getElementById('theme-switcher');
    const dayTitleEl = document.getElementById('scene-day-title');
    const sceneTitleEl = document.getElementById('scene-title');
    const descriptionEl = document.getElementById('scene-description');
    const choicesEl = document.getElementById('scene-choices');

    // --- CORE LOGIC ---

    /**
     * Loads and displays a scene from a JSON file.
     * @param {string} dayPath - Path to the day's JSON file (e.g., 'story/act1_summer/ch1_week1/day1_sunday.json')
     * @param {string} sceneKey - The key for the specific scene within the file (e.g., 'morning', 'afternoon_park')
     */
    async function loadScene(dayPath, sceneKey) {
        try {
            const response = await fetch(dayPath);
            if (!response.ok) {
                throw new Error(`File not found: ${dayPath}`);
            }
            const dayData = await response.json();
            const scene = dayData.scenes[sceneKey];

            if (!scene) {
                throw new Error(`Scene "${sceneKey}" not found in ${dayPath}`);
            }

            // Update UI
            dayTitleEl.textContent = dayData.dayTitle || 'A Day in the Life';
            sceneTitleEl.textContent = scene.title;
            descriptionEl.innerHTML = scene.description; // Use innerHTML to allow basic tags like <br> or <em>

            // Clear old choices
            choicesEl.innerHTML = '';

            // Create new choices
            scene.choices.forEach(choice => {
                const button = document.createElement('button');
                button.classList.add('choice-button');

                // Check for conditions
                const conditionsMet = checkConditions(choice.conditions);
                if (!conditionsMet) {
                    button.classList.add('disabled');
                    button.disabled = true;
                    button.textContent = choice.text + (choice.lockedText ? ` (${choice.lockedText})` : ' (Locked)');
                } else {
                    button.textContent = choice.text;
                    button.addEventListener('click', () => handleChoice(choice));
                }
                
                choicesEl.appendChild(button);
            });

        } catch (error) {
            console.error('Error loading scene:', error);
            sceneTitleEl.textContent = 'Error';
            descriptionEl.textContent = `Could not load story content. Please check the console (F12) for details. Error: ${error.message}`;
            choicesEl.innerHTML = '';
        }
    }

    /**
     * Processes a player's choice.
     * @param {object} choice - The choice object from the JSON.
     */
    function handleChoice(choice) {
        // 1. Update game state if necessary
        if (choice.setState) {
            Object.assign(gameState, choice.setState);
            console.log('New Game State:', gameState); // For debugging
        }

        // 2. Determine the next scene
        const [nextDayPath, nextSceneKey] = choice.target.split('#');

        // If the target is in the same file, nextDayPath will be empty.
        // If it's a new file, we need to construct the full path.
        const currentPath = window.currentDayPath; // We'll store the current path globally
        const nextPath = nextDayPath ? `story/${nextDayPath}` : currentPath;

        window.currentDayPath = nextPath; // Update global path
        loadScene(nextPath, nextSceneKey);
    }

    /**
     * Checks if the conditions for a choice are met by the current gameState.
     * @param {object} conditions - The conditions object from the JSON.
     * @returns {boolean} - True if all conditions are met, otherwise false.
     */
    function checkConditions(conditions) {
        if (!conditions) return true; // No conditions, always available

        for (const key in conditions) {
            // If any condition is not met, return false
            if (gameState[key] !== conditions[key]) {
                return false;
            }
        }
        return true; // All conditions met
    }

    // --- THEME SWITCHER LOGIC ---
    function applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
    }

    themeSwitcher.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    });

    // --- INITIALIZATION ---
    function init() {
        const initialDayPath = 'story/act1_summer/ch1_week1/day1_sunday.json';
        const initialSceneKey = 'morning';
        window.currentDayPath = initialDayPath; // Store initial path
        
        loadScene(initialDayPath, initialSceneKey);
    }

    init();
});
