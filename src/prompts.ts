const HTML_RULES = `
// These rules guide the IMPLEMENTATION of the web page, whose STRUCTURE and FUNCTIONALITY are primarily defined by the provided webDSL.
// Adhere to the webDSL for what elements to create, their hierarchy, interactivity, and states.
// These rules focus on the HOW: code quality, styling, and specific technical constraints for the HTML, CSS, and JavaScript.

1.  **General Implementation Principles**:
    *   **Output Format**: Generate ONLY complete, valid, and ready-to-use HTML. No surrounding text, markdown, or other formats unless the content itself is markdown.
    *   **Self-Contained**: All HTML, CSS (including Tailwind CSS utility classes), and JavaScript MUST be self-contained within the single HTML output. No external file links for CSS or JS. CDN links for libraries (like Tailwind, Chart.js, jQuery, D3.js, Monaco Editor, Leaflet) are permissible as specified in examples or \`CODE_PROMPT_RULES\`.
    *   **Desktop-First**: Focus on a desktop-first responsive design approach. Ensure usability with mouse and keyboard.
    *   **Modern Practices**: Use semantic HTML5. Employ modern CSS techniques (Flexbox, Grid) via Tailwind CSS as per \`CODE_PROMPT_RULES\`. Write ES6+ JavaScript.
    *   **Code Quality**: Produce clean, readable, maintainable, and cross-browser compatible code. Avoid pseudo-code.

2.  **Styling & UI (Guided by \`CODE_PROMPT_RULES\` and \`webDSL\` visual descriptions)**:
    *   **Tailwind CSS**: MANDATORY. Utilize Tailwind CSS utility classes for ALL styling as specified in \`CODE_PROMPT_RULES\`. Do not use custom CSS or inline \`style\` attributes unless absolutely unavoidable for dynamic properties not coverable by Tailwind utilities or for library-specific needs (e.g., Chart.js canvas sizing).
    *   **Visual Consistency**: Ensure the visual design (spacing, typography, color) is consistent and aligns with any aesthetic guidance from the \`webDSL\` (e.g., \`element.attributes.className\`, \`element.functionality\` descriptions implying visual traits).
    *   **Interactivity Feedback**: All interactive elements (buttons, inputs, links, custom components) must have clear hover, focus, and active states, implemented using Tailwind\\'s state variants. Implement smooth transitions and animations where appropriate to enhance user experience.

3.  **JavaScript & Interactivity (Driven by \`webDSL.events\`, \`webDSL.states\`, \`webDSL.flows\`)**:
    *   **jQuery**: MANDATORY for DOM manipulation and event handling, as per \`CODE_PROMPT_RULES\`.
    *   **Event Handling**: Implement JavaScript logic to realize the \`events\` defined in the \`webDSL\`. Event handlers should accurately update states or affect target elements as described in \`webDSL.events[n].affects\`.
    *   **State Management (Conceptual)**: While the \`webDSL\` defines states, your JavaScript will need to manage these in the browser. For example, if \`webDSL\` specifies a state \`isModalOpen\`, your JS should handle setting and reading this (e.g., using a variable or data attribute) to control modal visibility.
    *   **Dynamic Content**: For elements whose content or appearance is dynamic (based on \`webDSL\` states or interactions), ensure your JavaScript correctly updates the DOM.

4.  **Accessibility (ARIA)**:
    *   Implement appropriate ARIA attributes (roles, states, properties) to ensure accessibility, especially for custom interactive components.
    *   Ensure keyboard navigability for all interactive elements.

5.  **Performance Considerations**:
    *   Use efficient selectors (jQuery).
    *   Optimize asset loading if any direct image assets are embedded (prefer \`placehold.co\` for placeholders as per \`CODE_PROMPT_RULES\`).
    *   Be mindful of animation performance.

// DO NOT introduce components or interactivity not specified or implied by the webDSL. The webDSL is the blueprint.
// If the webDSL is missing detail, make reasonable, high-quality interpretations.
`.trim();

const CODE_PROMPT_RULES = `
// --- MANDATORY TECHNICAL REQUIREMENTS ---
// Adherence to these rules is CRITICAL for all HTML, CSS, and JavaScript code generation.

// 1. STYLING: TAILWIND CSS (MANDATORY)
//    - ALL styling MUST be implemented using Tailwind CSS utility classes.
//    - DO NOT use inline 'style' attributes or <style> blocks with custom CSS, unless absolutely unavoidable for dynamic properties not directly manageable by Tailwind utilities or for specific library integration needs (e.g., sizing a Chart.js canvas).
//    - Leverage Tailwind's full capabilities:
//        - Design System: Systematically use Tailwind's color palette, spacing scale, typography, etc.
//        - Layout: Use flexbox and grid utilities for all layouts.
//        - Responsiveness: Implement responsive design using Tailwind's breakpoint prefixes (sm:, md:, lg:, etc.).
//        - States: Style all interactive elements (buttons, links, inputs) for hover, focus, active, and other states using Tailwind's state variants (e.g., hover:bg-blue-700).
//        - Dark Mode: Utilize Tailwind's dark mode utilities (dark:) if applicable to the design.
//        - Transitions & Animations: Apply Tailwind's transition and animation utilities for smooth interactions.
//    - Optimize component styling with Tailwind's utility-first approach.

// 2. JAVASCRIPT: JQUERY (MANDATORY)
//    - ALL DOM manipulation, event handling, and AJAX operations MUST use jQuery.
//    - Use jQuery selectors and methods (e.g., $('#id'), $('.class'), $.ajax(), .on(), .addClass()) instead of vanilla JavaScript equivalents (e.g., document.getElementById, fetch, addEventListener).
//    - Utilize jQuery's built-in methods for animations where appropriate.

// 3. CODE OUTPUT & STRUCTURE:
//    - Output ONLY the raw HTML code. DO NOT wrap the final HTML output in triple backticks (\`\`\`) or any other non-HTML formatting (e.g., XML tags, explanatory text).
//    - Ensure the generated HTML is complete, well-formed, and ready to be rendered.
//    - NO inline JavaScript event handlers (e.g., <button onclick="...">). Bind all events using jQuery's .on() method in a <script> tag.

// 4. EXTERNAL RESOURCES & ASSETS:
//    - Placeholder Images: MUST use \`https://placehold.co\`. Example: \`https://placehold.co/300x150?text=My+Image\`
//    - DO NOT include links to any other external websites or resources unless they are approved CDNs for libraries like Chart.js, Leaflet, D3.js, Monaco Editor, as seen in HTML_EXAMPLES. All other assets should be self-contained if possible or use placeholders.

// 5. CSS VARIABLES IN JAVASCRIPT:
//    - When referencing CSS variables in JavaScript, ensure they are correctly formatted as strings for jQuery's .css() method or similar. Example: \`$(this).css('background-color', "var(--my-custom-color)")\`.

// 6. COMPONENT IMPLEMENTATION & FUNCTIONALITY:
//    - Implement components and features based on the primary requirements (e.g., from webDSL). Do not add unrequested components simply because they appear in examples.
//    - Ensure all interactive controls have appropriate data binding (conceptually, managed via JS and state) and state management logic.
//    - Implement proper validation and user-friendly error handling for all inputs and forms.

// 7. ACCESSIBILITY (A11Y):
//    - Include appropriate ARIA attributes to enhance accessibility.
//    - Ensure all interactive elements are keyboard navigable.
//    - Use Tailwind's accessibility utilities (e.g., sr-only) where appropriate.

// --- SPECIFIC FEATURE GUIDELINES (Apply when relevant based on requirements) ---
// - Visualization Tools (e.g., Charts):
//    - If using chart libraries (like Chart.js), style them using Tailwind classes where possible.
//    - Implement interactive tooltips and controls (e.g., for changing chart type, filtering data) using Tailwind for styling the control elements.
// - Language Learning Features: Design bilingual interfaces using Tailwind's layout utilities.
// - Maps: Implement interactive route visualization, styling map control overlays with Tailwind.
// - Time Comparison: Create draggable clock interfaces using Tailwind for styling.
// - Task Planning: Build interactive task boards using Tailwind's grid system.
`.trim();

const ACTUAL_HTML_PROMPT_RULES = `
// These rules govern the final output and general behavior when generating/updating the HTML artifact.
// The primary specification for the artifact\\'s structure, content, and interactivity comes from the <web-dsl>.

-   **Output Integrity**:
    *   Respond with the ENTIRE updated HTML artifact. No additional explanatory text, greetings, or meta-comments outside the HTML.
    *   Do not wrap the HTML output in any XML tags (like <artifact>) or markdown code FENCES (triple backticks) unless the content *within* the HTML (e.g., a <script type="text/markdown"> block) is itself markdown. The output should be raw HTML.

-   **Adherence to \`webDSL\`**:
    *   The provided \`<web-dsl>\` is the **primary source of truth** for the page\\'s structure, elements, interactivity, and states. Your HTML implementation MUST faithfully realize the \`webDSL\`.
    *   Implement all elements, states, and event handlers as defined in the \`webDSL\`.
    *   If the \`webDSL\` seems to lack detail for a rich implementation, infer intelligently, prioritizing user experience and modern design, but do not contradict the \`webDSL\`.

-   **Code & Styling (Referencing \`CODE_PROMPT_RULES\` from \`HTML_RULES\`)**:
    *   All specific coding rules (Tailwind CSS usage, jQuery mandate, placeholder images, etc.) are defined in \`CODE_PROMPT_RULES\`, which is part of the main \`HTML_RULES\`. Follow them strictly.
    *   Generate comprehensive, detailed, and production-quality HTML, CSS (as Tailwind classes), and JavaScript.

-   **Content & Design**:
    *   Never fabricate or make up numbers or data unless it\\'s clearly for placeholder/example purposes and the \`webDSL\` implies such content.
    *   Focus on desktop-first design and ensure smooth, delightful user interactions.
    *   Incorporate user\\'s preferred colors if provided and valid, ensuring accessibility (contrast ratios).

-   **Self-Containment & External Resources**:
    *   All resources must be self-contained within the HTML or use approved CDNs as specified in \`HTML_RULES\` or \`CODE_PROMPT_RULES\`. No other external links or references.

-   **Contextual Information**:
    *   Leverage \`<web-search-results>\` if provided to enhance implementation quality, ensuring solutions align with \`webDSL\`.
    *   Consider \`<reflections>\` for user preferences not explicitly in \`webDSL\`.

`.trim();

const HTML_EXAMPLES = `
    // These examples illustrate HOW complex components MIGHT be implemented in HTML/CSS/JS.
    // They are for REFERENCE and INSPIRATION, especially for translating webDSL concepts into concrete code.
    // DO NOT directly copy them. Adapt patterns to the specific webDSL provided for the current task.

<chart>
    To display a chart, output rendering code for Chart.js in the following format.
    // This example shows how a 'chart' element in webDSL could be realized with interactive controls.
    You should also generate some suitable adjustments for the chart for the user.

    Notes:
    - You should always put the Chart object in a variable called \`chart\`.
    - Only use official Chart.js configuration fields.
    - MUST include \`controls1\` block in the code.
    - You MUST use as many components as possible, especially \`input\`, \`button\`, \`select\`, \`dropdown box\` etc. in floating-controls.
    - When there are multiple reports, it is best to list them in parallel.
    - Each chart MUST have its own dedicated set of controls that are strictly bound to it:
        * Controls should be placed in a dedicated container with a unique ID
        * Each control must have a unique ID that includes the chart\\'s ID
        * All control event handlers must directly reference their specific chart instance
        * Controls should be positioned relative to their chart
        * Controls should be hidden when their chart is not visible
        * Controls should be disabled when their chart is not interactive

    Here is a sample code for rendering a monthly sales line chart:

    \`\`\`html
    <html>
    <head>
        <title>Chart Prompt Demo</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 min-h-screen flex items-center justify-center">
        <div class="bg-white rounded-2xl shadow-lg p-6 max-w-xl w-full relative">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span>📈</span> Sales Chart
                </h2>
                <button id="togglePanel" class="ml-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium focus:outline-none">Settings</button>
            </div>
            <div class="relative h-72">
                <canvas id="myChart1" class="w-full h-full"></canvas>
                <div id="controls1" class="absolute top-2 right-2 bg-white/95 p-4 rounded-xl shadow-lg z-10 transition-all duration-200 opacity-0 pointer-events-none w-56">
                    <div class="flex flex-col gap-3">
                        <div class="flex items-center justify-between text-xs text-gray-600">
                            <span>Background</span>
                            <input type="color" id="bgColor1" value="#ff6384" class="h-7 border rounded" style="max-width: 100px;">
                        </div>
                        <div class="flex items-center justify-between text-xs text-gray-600">
                            <span>Border</span>
                            <input type="color" id="borderColor1" value="#404040" class="h-7 border rounded" style="max-width: 100px;">
                        </div>
                        <div class="flex items-center justify-between text-xs text-gray-600">
                            <span>Type</span>
                            <select id="chartType1" class="border rounded px-1 py-0.5 text-xs" style="max-width: 100px;">
                                <option value="bar">Bar</option>
                                <option value="line">Line</option>
                                <option value="pie">Pie</option>
                            </select>
                        </div>
                        <div class="flex items-center justify-between text-xs text-gray-600">
                            <span>Font</span>
                            <input type="number" id="fontSize1" value="14" min="10" max="24" class="border rounded px-1 py-0.5 text-xs" style="max-width: 100px;">
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.min.js"></script>
        <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
        <script>
        $(function() {
            const config = {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Sales',
                        data: [65, 59, 80, 81, 56, 55],
                        backgroundColor: '#ff6384',
                        borderColor: '#404040',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { font: { size: 14, family: 'Arial' } } }
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { font: { size: 14 } } },
                        x: { ticks: { font: { size: 14 } } }
                    }
                }
            };
            (async function() {
                while (!window.Chart) await new Promise(r => setTimeout(r, 30));
                const ctx = document.getElementById('myChart1').getContext('2d');
                window.myChart1 = new window.Chart(ctx, config);
            })();
            $('#togglePanel').on('click', function(e) {
                $('#controls1').toggleClass('opacity-0 pointer-events-none opacity-100 pointer-events-auto');
                e.stopPropagation();
            });
            $(document).on('click', function(e) {
                if (!$(e.target).closest('#controls1').length && !$(e.target).is('#togglePanel')) {
                    $('#controls1').addClass('opacity-0 pointer-events-none').removeClass('opacity-100 pointer-events-auto');
                }
            });
            $('#controls1 input, #controls1 select').on('change', function() {
                const bg = $('#bgColor1').val(), border = $('#borderColor1').val(), type = $('#chartType1').val(), font = parseInt($('#fontSize1').val());
                if (!window.myChart1) return;
                window.myChart1.config.type = type;
                window.myChart1.config.data.datasets[0].backgroundColor = bg;
                window.myChart1.config.data.datasets[0].borderColor = border;
                const setFont = obj => obj && obj.font && (obj.font.size = font);
                setFont(window.myChart1.options.plugins.legend.labels);
                setFont(window.myChart1.options.scales?.y?.ticks);
                setFont(window.myChart1.options.scales?.x?.ticks);
                window.myChart1.update();
            });
        });
        </script>
    </body>
    </html>
    \`\`\`
</chart>

<vscode>
    If you need to display VSCode content, please use the following code.
    // This example demonstrates how a complex UI like a VSCode interface, potentially described abstractly in webDSL, could be rendered.
    Notes:
    - Use it when the user wants to display a vscode interface.
    - Prohibit drawing editor manually, MUST use the \`@monaco-editor/loader\` to load the monaco editor.
    - Use fork_right icon for source control
    - Use account_tree icon for branch
    - Place the code to edit in the \`console.log("Hello World");\` position.

    The generated vscode interface code must be generated to \`{vscode-interface}\` here.
    The vscode interface should be interactive and have controls.

    Here is the sample code:

    \`\`\`html
    <html>
    <head>
        <meta charset="UTF-8">
        <title>VSCode Clone with Monaco Editor & AI Chat</title>
        <!-- Tailwind CSS CDN -->
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            tailwind.config = {
                theme: {
                    extend: {
                        colors: {
                            'editor-bg': '#1e1e1e',
                            'sidebar-bg': '#252526',
                            'activity-bar': '#333',
                            'status-bar': '#007acc',
                            'hover-bg': '#404040',
                            'border-color': '#3d3d3d',
                            'input-bg': '#3c3c3c',
                        }
            }
            }

            body {
                height: 100vh;
                background: var(--vscode-background);
                color: var(--vscode-text);
                font-family: 'Segoe UI', system-ui, sans-serif;
                    }

            body {
                height: 100vh;
                background: var(--vscode-background);
                color: var(--vscode-text);
                font-family: 'Segoe UI', system-ui, sans-serif;
            }
            }

            .container {
                display: grid;
                grid-template:
                    "activity-bar main-content sidebar" 1fr
                    "status-bar status-bar status-bar" auto / 48px 1fr 300px;
                height: 100vh;
                }

            .container {
                display: grid;
                grid-template:
                    "activity-bar main-content sidebar" 1fr
                    "status-bar status-bar status-bar" auto / 48px 1fr 300px;
                height: 100vh;
            }
        </script>
        <!-- jQuery CDN -->
        <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
        <!-- Monaco Editor UMD CDN -->
        <script src="https://cdn.jsdelivr.net/npm/monaco-editor/min/vs/loader.js"></script>
        <link rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        <style>
            .material-symbols-rounded {
                font-family: 'Material Symbols Rounded';
                font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48;
            }
        </style>
    </head>
    <body class="h-screen bg-editor-bg text-[#d4d4d4] font-sans">
        <div class="grid grid-rows-[1fr_auto] grid-cols-[48px_1fr_300px] h-screen" style="grid-template-areas: 'activity-bar main-content sidebar' 'status-bar status-bar status-bar';">
            <!-- Activity Bar -->
            <div class="flex flex-col items-center pt-3 bg-activity-bar" style="grid-area: activity-bar;">
                <div class="w-8 h-8 my-1 grid place-items-center rounded cursor-pointer hover:bg-hover-bg activity-item">
                    <span class="material-symbols-rounded">folder</span>
                </div>
                <div class="w-8 h-8 my-1 grid place-items-center rounded cursor-pointer hover:bg-hover-bg activity-item">
                    <span class="material-symbols-rounded">search</span>
                </div>
                <div class="w-8 h-8 my-1 grid place-items-center rounded cursor-pointer hover:bg-hover-bg activity-item">
                    <span class="material-symbols-rounded">fork_right</span>
                </div>
                <div class="w-8 h-8 my-1 grid place-items-center rounded cursor-pointer hover:bg-hover-bg activity-item">
                    <span class="material-symbols-rounded">bug_report</span>
                </div>
                <div class="w-8 h-8 my-1 grid place-items-center rounded cursor-pointer hover:bg-hover-bg activity-item">
                    <span class="material-symbols-rounded">extension</span>
                </div>
                <div class="w-8 h-8 my-1 grid place-items-center rounded cursor-pointer hover:bg-hover-bg activity-item active-item bg-hover-bg">
                    <span class="material-symbols-rounded">smart_toy</span>
            </div>
            </div>
            <div class="main-content">
                <div id="editor"></div>
                </div>
            <div class="main-content">
                <div id="editor"></div>
            </div>
            <!-- Main Content -->
            <div class="flex flex-col col-span-1 row-span-1" style="grid-area: main-content;">
                <div id="editor" class="flex-1"></div>
            </div>
            <!-- AI Chat Sidebar -->
            <div class="bg-sidebar-bg border-l border-border-color" style="grid-area: sidebar;">
                <div class="flex flex-col h-full">
                    <div class="px-3 py-2 border-b border-border-color font-medium">AI Assistant</div>
                    <div id="chatMessages" class="flex-1 overflow-y-auto p-2.5 flex flex-col">
                        <div class="p-2 px-3 mb-2 rounded-lg max-w-[90%] bg-editor-bg border border-border-color self-start">
                            Hello! I\\'m your AI assistant. How can I help you with your code today?
                        </div>
                    </div>
                    <div class="p-2.5 border-t border-border-color">
                        <div class="flex">
                            <input type="text" id="chatInput" placeholder="Ask me anything..." 
                                class="bg-input-bg rounded px-3 py-2 w-full outline-none focus:ring-1 focus:ring-status-bar">
                            <button id="sendButton" class="ml-2 bg-status-bar hover:bg-[#0066aa] text-white rounded px-3 py-2">
                                <span class="material-symbols-rounded">send</span>
                            </button>
                    </div>
                    </div>
                    <div class="status-right">
                        <div id="encoding" class="status-item">UTF-8</div>
                        <div id="language" class="status-item">JavaScript</div>
                        <div id="cursor-position" class="status-item">Ln 1, Col 1</div>
                        </div>
                    <div class="status-right">
                        <div id="encoding" class="status-item">UTF-8</div>
                        <div id="language" class="status-item">JavaScript</div>
                        <div id="cursor-position" class="status-item">Ln 1, Col 1</div>
                    </div>
                </div>
            </div>
            <!-- Status Bar -->
            <div class="h-[22px] bg-status-bar flex items-center px-2 text-xs col-span-3" style="grid-area: status-bar;">
                <div class="flex w-full justify-between items-center">
                    <div class="flex items-center">
                        <div class="flex items-center px-2 h-full cursor-pointer hover:bg-white/10 status-item">
                            <span class="material-symbols-rounded text-base mr-1">account_tree</span>
                            <span>main</span>
                        </div>
                        <div class="flex items-center px-2 h-full cursor-pointer hover:bg-white/10 status-item">
                            <span class="material-symbols-rounded text-base mr-1">sync</span>
                        </div>
                        <div class="flex items-center px-2 h-full cursor-pointer hover:bg-white/10 status-item">
                            <span class="material-symbols-rounded text-base mr-1">error</span>
                            <span>0</span>
                            <span class="material-symbols-rounded text-base mx-1">warning</span>
                            <span>0</span>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <div id="encoding" class="px-2 h-full cursor-pointer hover:bg-white/10 status-item">UTF-8</div>
                        <div id="language" class="px-2 h-full cursor-pointer hover:bg-white/10 status-item">JavaScript</div>
                        <div id="cursor-position" class="px-2 h-full cursor-pointer hover:bg-white/10 status-item">Ln 1, Col 1</div>
                    </div>
                </div>
            </div>
        </div>
        <script>
            // Monaco Editor UMD loader config
            require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor/min/vs' } });
            require(['vs/editor/editor.main'], function () {
                var editor = monaco.editor.create(document.getElementById('editor'), {
                    value: '// Write your code here\nconsole.log("Hello World");',
                    language: 'javascript',
                    theme: 'vs-dark',
                    minimap: { enabled: true },
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineHeight: 24,
                    fontFamily: 'Fira Code, Menlo, monospace',
                    glyphMargin: true
                });
                
                // jQuery for cursor position update
                editor.onDidChangeCursorPosition(function (e) {
                    $('#cursor-position').text(
                        \`Ln \${e.position.lineNumber}, Col \${e.position.column}\`
                    );
                });
                
                // Simple AI Chat functionality
                $('#sendButton').click(function() {
                    sendChatMessage();
                });
                
                $('#chatInput').keypress(function(e) {
                    if(e.which === 13) {
                        sendChatMessage();
                    }
                });
                
                function sendChatMessage() {
                    const message = $('#chatInput').val();
                    if (!message.trim()) return;
                    
                    // Add user message to chat
                    $('#chatMessages').append(
                        \`<div class="p-2 px-3 mb-2 rounded-lg max-w-[90%] bg-[#2d2d2d] self-end ml-auto">\${message}</div>\`
                    );
                    
                    // Clear input
                    $('#chatInput').val('');
                    
                    // Scroll to bottom
                    const chatMessages = document.getElementById('chatMessages');
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    
                    // Simulate AI response (in a real app, this would call an API)
                    setTimeout(() => {
                        const editorCode = editor.getValue();
                        let response = "I've analyzed your code. It looks good! Is there anything specific you'd like help with?";
                        
                        if (message.toLowerCase().includes('explain') || message.toLowerCase().includes('what does')) {
                            response = "This code uses console.log() to output 'Hello World' to the browser console. It's a common first example when learning JavaScript.";
                        } else if (message.toLowerCase().includes('improve') || message.toLowerCase().includes('better')) {
                            response = "To improve your code, you could add error handling, comments for documentation, or consider using modern JavaScript features.";
                        } else if (message.toLowerCase().includes('help')) {
                            response = "I'm here to help! I can explain code concepts, suggest improvements, or help you debug issues. What specific assistance do you need?";
                        }
                        
                        $('#chatMessages').append(
                            \`<div class="p-2 px-3 mb-2 rounded-lg max-w-[90%] bg-editor-bg border border-border-color self-start">\${response}</div>\`
                        );
                        
                        // Scroll to bottom again
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }, 500);
                }
            });
        </script>
    </body>
    </html>
    \`\`\`
</vscode>

<video>
    If the user wants to display a video, please use the following code.
    // This example illustrates embedding a video, which might be specified by a 'video' elementType in webDSL.
    Use it when the user wants to display a video.

    Note:
    - The video url format is \`https://www.youtube.com/embed/video_id\`
    - Put the video in a specific location according to user needs, or watch it in the small window in the lower right corner
    - Do not add other control buttons, only the video player

    Here is the sample code:

    \`\`\`html
    <html>
        <head>
            <title>Video</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
            <div class="relative pt-[56.25%] h-0 overflow-hidden">
                <iframe class="absolute top-0 left-0 w-full h-full"
                    src="https://www.youtube.com/embed/wRsNrIQMZFI" frameborder="0" allowfullscreen>
                </iframe>
            </div>
        </body>
    </html>
    \`\`\`
</video>

<calculator>
    To display the calculator, use the following code.
    // This demonstrates a self-contained calculator component, potentially representing an 'interactiveTool' element in webDSL.
    Use it when the user needs you to calculate four arithmetic operations.

    Notes:
    - If the user requests calculation of a formula, please output the following calculator and use the calculator to calculate, replacing '100+100' with the user\\'s formula.

    Here is the sample code:

    \`\`\`html
    <html>
        <head>
            <title>Calculator</title>
            <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="flex justify-center items-center min-h-screen bg-white">
            <div class="bg-white p-6 rounded-2xl shadow-lg w-80">
                <div class="text-2xl mb-2 h-12 bg-gray-100 rounded-lg p-2 overflow-x-auto" id="display">100+100</div>
                <div class="grid grid-cols-4 gap-2">
                    <button class="py-4 text-lg rounded-lg bg-gray-200 hover:bg-gray-300" data-value="7">7</button>
                    <button class="py-4 text-lg rounded-lg bg-gray-200 hover:bg-gray-300" data-value="8">8</button>
                    <button class="py-4 text-lg rounded-lg bg-gray-200 hover:bg-gray-300" data-value="9">9</button>
                    <button class="py-4 text-lg rounded-lg bg-gray-200 hover:bg-gray-300" data-value="/">÷</button>
                    <button class="py-4 text-lg rounded-lg bg-gray-200 hover:bg-gray-300" data-value="4">4</button>
                    <button class="py-4 text-lg rounded-lg bg-gray-200 hover:bg-gray-300" data-value="5">5</button>
                    <button class="py-4 text-lg rounded-lg bg-gray-200 hover:bg-gray-300" data-value="6">6</button>
                    <button class="py-4 text-lg rounded-lg bg-gray-200 hover:bg-gray-300" data-value="*">×</button>
                    <button class="py-4 text-lg rounded-lg bg-gray-200 hover:bg-gray-300" data-value="1">1</button>
                    <button class="py-4 text-lg rounded-lg bg-gray-200 hover:bg-gray-300" data-value="2">2</button>
                    <button class="py-4 text-lg rounded-lg bg-gray-200 hover:bg-gray-300" data-value="3">3</button>
                    <button class="py-4 text-lg rounded-lg bg-gray-200 hover:bg-gray-300" data-value="-">−</button>
                    <button class="py-4 text-lg rounded-lg bg-gray-200 hover:bg-gray-300" data-value="0">0</button>
                    <button class="py-4 text-lg rounded-lg bg-gray-200 hover:bg-gray-300" data-value=".">.</button>
                    <button class="py-4 text-lg rounded-lg bg-green-600 text-white hover:bg-green-700" id="equal">=</button>
                    <button class="py-4 text-lg rounded-lg bg-gray-200 hover:bg-gray-300" data-value="+">+</button>
                    <button class="py-4 text-lg rounded-lg bg-red-600 text-white hover:bg-red-700 col-span-4" id="clear">Clear</button>
                </div>
            </div>
            <script>
                $(function() {
                    const $display = $('#display');
                    $("button[data-value]").on('click', function() {
                        $display.text($display.text() + $(this).data('value'));
                    });
                    $('#clear').on('click', function() {
                        $display.text('');
                    });
                    $('#equal').on('click', function() {
                        try {
                            $display.text(eval($display.text()));
                        } catch (e) {
                            $display.text('Error');
                        }
                    });
                });
            </script>
        </body>
    </html>
    \`\`\`
</calculator>

<map>
    If the user wants to display a map, please use the following code.
    // This provides a way to implement a 'map' element from webDSL using Leaflet.js.
    Use it when the user wants to display a map.

    Note:
    - Add the following link to the head section (MANDATORY):
        \`\`\`html
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet/dist/leaflet.css" />
        \`\`\`

    Here is the sample code:

    \`\`\`html
    <html>
    <head>
        <title>Beijing to Chicago Route</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet/dist/leaflet.css" />
        <style type="text/css">
            #map {
                height: 80vh;
                width: 100%;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script src="https://cdn.jsdelivr.net/npm/leaflet/dist/leaflet.js"></script>
        <script>
            // Initialize map
            const map = L.map('map').setView([50, 100], 2);

            // Add map layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(map);

            // Coordinate definitions
            const beijing = [39.9042, 116.4074];  // Beijing
            const chicago = [41.8781, -87.6298];  // Chicago

            // Add markers
            L.marker(beijing)
                .addTo(map)
                .bindPopup('Beijing<br>Capital of China')
                .openPopup();

            L.marker(chicago)
                .addTo(map)
                .bindPopup('Chicago<br>Major US City');

            // Draw straight line connecting two points
            const route = L.polyline([beijing, chicago], {
                color: 'red',
                weight: 2,
                dashArray: '5,5'
            }).addTo(map);

            // Add scale bar
            L.control.scale().addTo(map);
        </script>
    </body>
    </html>
    \`\`\`
</map>

<clock>
    If the user wants to display a clock, please use the following code.
    // This example shows how an interactive 'clock' or 'timeComparison' tool described in webDSL could be built.
    Use it when the user wants to display a clock.

    Note:
    - If the user needs to compare times, the clock should allow dragging the hands and the two clocks should be synchronized
    - For time comparison, generate two canvas clocks side by side as shown in the example

    Here is the sample code:

    \`\`\`html
    <html>
    <head>
        <title>Clock</title>
        <!-- Tailwind CSS CDN -->
        <script src="https://cdn.tailwindcss.com"></script>
        <!-- jQuery CDN -->
        <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    </head>
    <body class="bg-gray-100 min-h-screen flex items-center justify-center">
        <div class="flex gap-5">
            <div class="flex flex-col items-center">
                <canvas id="cnClock" width="300" height="300" class="border border-gray-300 rounded-full shadow bg-gray-50"></canvas>
                <div class="text-gray-800 text-2xl drop-shadow mt-4 font-bold">BEIJING</div>
            </div>
            <div class="flex flex-col items-center">
                <canvas id="usClock" width="300" height="300" class="border border-gray-300 rounded-full shadow bg-gray-50"></canvas>
                <div class="text-gray-800 text-2xl drop-shadow mt-4 font-bold">NEW YORK</div>
            </div>
        </div>

        <script>
            const PI2 = Math.PI * 2;
            const HOUR_DIFF = 13; // Beijing time is 13 hours ahead of New York

            class Clock {
                constructor($canvas, utcOffset) {
                    this.$canvas = $canvas;
                    this.canvas = $canvas[0];
                    this.ctx = this.canvas.getContext('2d');
                    this.utcOffset = utcOffset;
                    this.size = this.canvas.width;
                    this.center = this.size / 2;
                    this.time = new Date();
                    this.dragging = null;
                    this.otherClock = null;
                    this.init();
                }

                init() {
                    this.$canvas.on('mousedown', e => this.handleMouseDown(e));
                    $(document).on('mousemove', e => this.handleMouseMove(e));
                    $(document).on('mouseup', () => this.dragging = null);
                }

                draw() {
                    this.ctx.clearRect(0, 0, this.size, this.size);
                    this.drawFace();
                    this.drawNumbers();
                    this.drawHands();
                }

                drawFace() {
                    this.ctx.beginPath();
                    this.ctx.arc(this.center, this.center, this.center - 5, 0, PI2);
                    this.ctx.strokeStyle = '#333';
                    this.ctx.lineWidth = 4;
                    this.ctx.stroke();
                }

                drawNumbers() {
                    this.ctx.font = '16px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    for (let i = 1; i <= 12; i++) {
                        const angle = i * Math.PI / 6 - Math.PI / 2;
                        const x = this.center + Math.cos(angle) * (this.center - 30);
                        const y = this.center + Math.sin(angle) * (this.center - 30);
                        this.ctx.fillText(i, x, y);
                    }
                }

                drawHands() {
                    const time = new Date(this.time.getTime() + this.utcOffset * 3600000);
                    const hours = time.getHours() % 12;
                    const minutes = time.getMinutes();
                    const seconds = time.getSeconds();

                    // Hour hand
                    this.drawHand(hours * 30 + minutes * 0.5, 50, 6, '#333');
                    // Minute hand
                    this.drawHand(minutes * 6 + seconds * 0.1, 70, 4, '#666');
                    // Second hand
                    this.drawHand(seconds * 6, 80, 2, 'red');
                }

                drawHand(angle, length, width, color) {
                    angle = angle * Math.PI / 180 - Math.PI / 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.center, this.center);
                    this.ctx.lineTo(
                        this.center + Math.cos(angle) * length,
                        this.center + Math.sin(angle) * length
                    );
                    this.ctx.strokeStyle = color;
                    this.ctx.lineWidth = width;
                    this.ctx.lineCap = 'round';
                    this.ctx.stroke();
                }

                handleMouseDown(e) {
                    const rect = this.canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left - this.center;
                    const y = e.clientY - rect.top - this.center;
                    const dist = Math.sqrt(x * x + y * y);

                    if (dist < 50) this.dragging = 'hour';
                    else if (dist < 70) this.dragging = 'minute';
                    else if (dist < 80) this.dragging = 'second';
                    else return;

                    this.handleMouseMove(e);
                }

                handleMouseMove(e) {
                    if (!this.dragging) return;

                    const rect = this.canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left - this.center;
                    const y = e.clientY - rect.top - this.center;
                    let angle = Math.atan2(y, x) + Math.PI / 2;
                    if (angle < 0) angle += PI2;

                    const time = new Date();
                    switch (this.dragging) {
                        case 'hour':
                            const hours = (angle * 180 / Math.PI) / 30;
                            time.setHours(hours);
                            break;
                        case 'minute':
                            const minutes = (angle * 180 / Math.PI) / 6;
                            time.setMinutes(minutes);
                            break;
                        case 'second':
                            const seconds = (angle * 180 / Math.PI) / 6;
                            time.setSeconds(seconds);
                            break;
                    }

                    this.time = new Date(time.getTime() - this.utcOffset * 3600000);
                    this.draw();

                    // Sync to another clock
                    const otherTime = new Date(time.getTime() - (this.utcOffset === 0 ? HOUR_DIFF : -HOUR_DIFF) * 3600000);
                    this.otherClock.time = otherTime;
                    this.otherClock.draw();
                }
            }

            // Initialize clock (Beijing UTC+8 set to 0 offset, New York UTC-5 set to -13 offset)
            $(function() {
                const cnClock = new Clock($('#cnClock'), 0);
                const usClock = new Clock($('#usClock'), -HOUR_DIFF);

                cnClock.draw();
                usClock.draw();

                cnClock.otherClock = usClock;
                usClock.otherClock = cnClock;

                cnClock.time = new Date();
                usClock.time = new Date(cnClock.time.getTime() - HOUR_DIFF * 3600000);

                setInterval(() => {
                    cnClock.time = new Date();
                    cnClock.draw();
                    usClock.time = new Date(cnClock.time.getTime() - HOUR_DIFF * 3600000);
                    usClock.draw();
                }, 1000);
            });
        </script>
    </body>
    </html>
    \`\`\`
</clock>
<game>
    If the user wants to display a game or animation, please use D3.js to implement it.
    // This D3.js example for a game illustrates how dynamic, interactive content specified in webDSL could be rendered.
    D3 is excellent for creating interactive and animated visualizations, games, and dynamic content.
    Use it when the user wants to display games or animations.

    Here is the sample code:
    \`\`\`html
    <html>
    <head>
    <meta charset="UTF-8">
    <title>Snake Game Demo</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- D3.js CDN -->
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <!-- jQuery CDN -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    </head>
    <body class="bg-gray-100 flex flex-col items-center justify-center min-h-screen">
    <h1 class="text-2xl font-bold mb-4">Snake Game</h1>
    <div class="bg-white rounded shadow p-6 flex flex-col items-center">
        <svg id="game" width="400" height="400" class="border border-gray-300 mb-4"></svg>
        <div class="mb-2 text-lg" id="score">Score: 0</div>
        <button id="restartBtn" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition mt-2 hidden">Restart</button>
        <div class="text-gray-500 mt-2 text-sm">Use arrow keys to play</div>
    </div>
    <script>
        const size = 20, w = 400, h = 400, nx = w/size, ny = h/size;
        const svg = d3.select('#game');
        let snake, dir, food, score, timer, active;

        function reset() {
        snake = [{x: nx/2|0, y: ny/2|0}];
        dir = {x: 1, y: 0};
        score = 0;
        food = placeFood();
        $('#score').text('Score: 0');
        $('#restartBtn').addClass('hidden');
        active = true;
        draw();
        clearInterval(timer);
        timer = setInterval(step, 120);
        }

        function placeFood() {
        let f;
        do {
            f = {x: Math.random()*nx|0, y: Math.random()*ny|0};
        } while (snake.some(s => s.x === f.x && s.y === f.y));
        return f;
        }

        function step() {
        const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
        if (head.x<0||head.x>=nx||head.y<0||head.y>=ny||snake.some(s=>s.x===head.x&&s.y===head.y)) return end();
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            score++;
            $('#score').text('Score: '+score);
            food = placeFood();
        } else {
            snake.pop();
        }
        draw();
        }

        function draw() {
        svg.selectAll('rect.snake').data(snake, d=>d.x+','+d.y)
            .join('rect')
            .attr('class','snake')
            .attr('width',size).attr('height',size)
            .attr('fill','#3b82f6').attr('rx',4).attr('ry',4)
            .attr('x',d=>d.x*size).attr('y',d=>d.y*size);
        svg.selectAll('rect.food').data([food])
            .join('rect')
            .attr('class','food')
            .attr('width',size).attr('height',size)
            .attr('fill','#f59e42').attr('rx',4).attr('ry',4)
            .attr('x',d=>d.x*size).attr('y',d=>d.y*size);
        }

        function end() {
        active = false;
        clearInterval(timer);
        $('#restartBtn').removeClass('hidden');
        }

        $(document).on('keydown', e => {
        if (!active) return;
        if (e.key==='ArrowUp'&&dir.y!==1) dir={x:0,y:-1};
        else if (e.key==='ArrowDown'&&dir.y!==-1) dir={x:0,y:1};
        else if (e.key==='ArrowLeft'&&dir.x!==1) dir={x:-1,y:0};
        else if (e.key==='ArrowRight'&&dir.x!==-1) dir={x:1,y:0};
        });
        $('#restartBtn').on('click', reset);
        $(reset);
    </script>
    </body>
    </html>
    \`\`\`
</game>
`.trim();

export const REQUIREMENTS_ANALYSIS_PROMPT = `

You are an expert system analyzing user requests to build or modify web interfaces. Your primary goal is to thoroughly understand the user's needs and translate them into a structured JSON object conforming to the requirementsAnalysisSchema. **Focus on understanding the user's problems and designing solutions that directly address their needs.** Your analysis should aim to describe a **modern, intuitive, and effective** user interface that solves the user's specific challenges.

Analyze the user's request based on the following context:
<context>
User Reflections:
{reflections}

Recent Artifact:
{recentArtifact}
</context>

**IMPORTANT: If the user expresses difficulties, challenges, failures, or confusion about how to accomplish a task, focus on creating a complete solution interface that directly addresses their problem. Design a UI that provides them with tools, visualizations, and interactions to overcome their specific challenge.**

Based on the user's request and the provided context, meticulously fill out the following fields in a JSON object:

1. **mainGoal**: Clearly articulate the primary objective or purpose of the HTML page or modification requested by the user. If the user is facing a difficulty or challenge, frame this as the solution to their problem rather than just describing the request.

2. **keyFeatures**: List the essential features and high-level components that directly solve the user's problems. Focus on features that:
   * Address the user's specific challenges
   * Provide clear paths to success
   * Offer multiple approaches to solve problems
   * Include built-in guidance and support

3. **technicalRequirements**: Specify interactive and animated solutions to solve user problems:
   * Interactive Elements: Define what users can manipulate (e.g., draggable objects, clickable areas, interactive charts)
   * Animation Solutions: Describe how animations help users understand and solve problems (e.g., step-by-step guides, visual feedback)
   * Game-like Features: If applicable, specify game mechanics that make problem-solving engaging (e.g., progress tracking, rewards)
   * Visual Tools: List tools users can interact with (e.g., drawing tools, calculators, visual editors)
   * Feedback Mechanisms: Define how the system responds to user actions (e.g., success animations, error indicators)
   * Learning Aids: Specify interactive tutorials or guided experiences

4. **preferences**: Capture design preferences focusing on usability and effectiveness:
   * Visual Hierarchy: How information and actions should be prioritized
   * Color System: Purpose of colors (e.g., status indicators, actions, information)
   * Typography: How text should be used to guide users
   * Layout: How space should be used to organize information
   * Motion: How animations should support user understanding
   * Feedback: How the system should communicate with users

5. **considerations**: Identify key constraints and requirements:
   * Performance targets
   * Browser compatibility requirements
   * Device support
   * Accessibility requirements
   * Security requirements
   * Scalability needs

6. **uiComponents**: Break down the interface into functional components that solve specific problems:
   * Navigation Components: How users move through the solution
   * Input Components: How users provide information
   * Display Components: How information is presented
   * Control Components: How users interact with the system
   * Feedback Components: How the system communicates with users
   * Help Components: How users get assistance

7. **interactions**: Detail how users will interact with the solution:
   * User Flows: Step-by-step processes to solve problems
   * State Changes: How the interface responds to user actions
   * Error Prevention: How the system prevents mistakes
   * Error Recovery: How users can recover from mistakes
   * Success Confirmation: How the system confirms successful actions

8. **dataVisualization**: If data display is needed, specify:
   * Data Types: What kind of data needs to be displayed
   * Visualization Goals: What users need to understand from the data
   * Interaction Requirements: How users should be able to explore the data
   * Update Patterns: How the visualization should update

9. **responsiveLayouts**: Describe how the solution adapts to different contexts:
   * Device-specific adaptations
   * Context-specific adaptations
   * Progressive enhancement approach
   * Content prioritization strategy

10. **accessibilityFeatures**: Specify how the solution should be accessible:
    * Navigation patterns
    * Content structure
    * Alternative content
    * Assistive technology support

11. **problemSolutionApproach**: Detail how the UI solves the user's specific problems:
    * Problem Analysis: How the interface helps users understand their problem
    * Solution Steps: How the interface guides users through solving their problem
    * Success Criteria: How users know they've solved their problem
    * Learning Support: How the interface helps users learn from the solution

**Special Handling Rules:**

* **User Difficulties:** When users express challenges, design interfaces that:
  * Break down complex problems into manageable steps
  * Provide clear guidance and feedback
  * Offer multiple solution paths
  * Include built-in learning support
  * Prevent common mistakes
  * Show clear progress and success indicators

* **Code-Related Solutions:** For code-related problems, specify:
  * Code editing capabilities needed
  * Code visualization requirements
  * Debugging support
  * Version control integration
  * Collaboration features
  * Error handling and feedback

* **Data Processing Solutions:** For data-related problems, specify:
  * Data input methods
  * Processing capabilities
  * Result visualization
  * Export/import functionality
  * Error handling
  * Progress tracking

* **Learning Solutions:** For educational problems, specify:
  * Content organization
  * Progress tracking
  * Assessment methods
  * Feedback mechanisms
  * Support resources

* **Task Management Solutions:** For organizational problems, specify:
  * Task organization
  * Progress tracking
  * Collaboration features
  * Reporting capabilities
  * Notification system

Always focus on how each component and feature directly contributes to solving the user's specific problems. Provide clear technical specifications that guide implementation without being overly prescriptive about specific technologies or packages.

Generate ONLY the JSON object representing this detailed analysis. Ensure your analysis is comprehensive, clear, and directly translates the user's problems into effective solution specifications.
`.trim();

export const WEB_DSL_PROMPT = `
You are a meticulous DSL architect and expert UI/UX designer, specializing in decomposing complex user requirements for web applications into a highly detailed and structured JSON DSL.
Your primary objective is to generate a comprehensive JSON object that strictly adheres to the 'webDSLSchema'. This DSL will serve as the authoritative blueprint for a frontend engineering team to build a rich, interactive, and complex single-page web application.
You think step-by-step, analyzing every nuance of the user's request to ensure all functionalities, UI elements, states, and interactions are captured with precision in the DSL.

**Core Task: Generate a Detailed Web DSL JSON**

Based on the provided user requirements, existing artifacts (if any), and reflections, your output MUST be a single JSON object conforming to 'webDSLSchema'.

**Key Considerations for Complex Single-Page Applications:**

1.  **Decomposition of Complexity**:
    *   Break down complex UI requirements into a well-organized, flat list of 'elements'. Utilize the 'parentId' field to establish clear hierarchical relationships.
    *   For intricate UI sections (e.g., dashboards with multiple charts, forms with conditional logic, interactive data grids, multi-step wizards), ensure each logical part is represented by distinct elements with clear 'id's and 'functionality'.

2.  **Rich Interactivity & State Management**:
    *   Define all necessary 'states' that govern the dynamic behavior of the application (e.g., loading statuses, filter values, selected items, modal visibility, user input data, error messages). Ensure 'initialValue' and 'description' for each state are clear.
    *   For every interactive element, meticulously define its 'events'. Each event must have:
        *   A precise 'handlerDescription' detailing the user action and the immediate system response or intended logic.
        *   A comprehensive 'affects' array specifying ALL target element 'id's or state 'name's that are modified by this event, the 'action' to be performed (e.g., 'updateState', 'setStyle', 'toggleClass', 'navigateTo', 'triggerAnimation'), and 'details' for the action (e.g., new state value, specific style changes).
    *   Utilize 'elements.interactions' (hover, focus, active) to describe fine-grained visual feedback.

3.  **User Flows & Conditional Logic**:
    *   Detail common and critical 'flows' (user interaction sequences). Each flow should have a descriptive 'name', 'description', and a list of 'steps' outlining the user's journey and system responses.
    *   If the requirements imply conditional rendering or behavior (e.g., "if user is admin, show X, else show Y"), represent this through state-driven visibility/content changes in your DSL. For example, an event might update a state, and an element's 'functionality' description or a flow step might note that its appearance/content depends on this state.

4.  **Data Representation & Binding (Conceptual)**:
    *   While the DSL doesn't implement data binding, its structure should facilitate it. For elements displaying dynamic data (e.g., a user profile name, a list of items), ensure their 'content' field (if static initially) or 'functionality' description clearly indicates what data they are meant to display, possibly referencing a state variable.

**Strict Adherence to \`webDSLSchema\`:**
*   Pay extremely close attention to the 'webDSLSchema' definition, especially the '.describe(...)' calls within it, which provide detailed guidance on each property's purpose, expected format, and examples.
*   All element 'id's MUST be unique and used consistently for 'parentId' and event 'target' references.
*   Use camelCase for property names and maintain consistent naming conventions.

**Example of a DSL for a Slightly More Complex Scenario (Illustrative - Adapt to actual requirements):**
*(This example focuses on structure and interaction, not exhaustive detail for brevity)*
<example-dsl>
{
  "description": "A product listing page with filtering capabilities and a detail modal.",
  "metadata": { "title": "Product Catalog" },
  "states": [
    { "name": "isLoadingProducts", "initialValue": "true", "description": "Tracks product loading state." },
    { "name": "productsData", "initialValue": "[]", "description": "Array of product objects (stringified JSON or descriptive)." },
    { "name": "filterCategory", "initialValue": "\\"all\\"", "description": "Current category filter." },
    { "name": "selectedProductId", "initialValue": "null", "description": "ID of the product selected for modal view, or null if none." },
    { "name": "isModalOpen", "initialValue": "false", "description": "Controls visibility of the product detail modal." }
  ],
  "elements": [
    // --- Filters ---
    { "id": "categoryFilterSelect", "parentId": "mainPageLayout", "elementType": "select", "functionality": "Allows user to select a product category.", "attributes": {"name": "category"},
      "events": [{
        "type": "onChange", "handlerDescription": "Updates 'filterCategory' state with selected value and re-fetches/filters products.",
        "affects": [{ "target": "filterCategory", "action": "updateState", "details": "event.target.value" }] // Placeholder for actual value access
      }]
    },
    // --- Product List Area ---
    { "id": "productListContainer", "parentId": "mainPageLayout", "elementType": "div", "className": ["grid", "grid-cols-3", "gap-4"], "functionality": "Container for product cards. Its content is dynamically populated based on 'productsData' and 'filterCategory'." },
    // --- Example Product Card (would be dynamically generated based on productsData) ---
    { "id": "productCardExample", "parentId": "productListContainer", "elementType": "div", "className": ["border", "p-4"], "functionality": "Displays a single product summary. This is a template; multiple such cards would exist.",
      "content": "Product Name Here",
      "events": [{
        "type": "onClick", "handlerDescription": "Sets 'selectedProductId' with this product's ID and opens the detail modal by setting 'isModalOpen' to true.",
        "affects": [
          { "target": "selectedProductId", "action": "updateState", "details": "this.productId" }, // Placeholder for actual ID
          { "target": "isModalOpen", "action": "updateState", "details": "true" }
        ]
      }]
    },
    // --- Modal ---
    { "id": "productDetailModal", "parentId": "mainPageLayout", "elementType": "div", "className": ["fixed", "inset-0", "bg-black/50", "flex", "items-center", "justify-center"], "functionality": "Modal to display product details. Visibility controlled by 'isModalOpen' state. Content based on 'selectedProductId' and 'productsData'.",
      // Children: modal content, close button
    },
    { "id": "modalCloseButton", "parentId": "productDetailModal", "elementType": "button", "content": "Close",
      "events": [{ "type": "onClick", "handlerDescription": "Closes the modal.", "affects": [{ "target": "isModalOpen", "action": "updateState", "details": "false" }] }]
    }
    // ... other elements like mainPageLayout, loading indicators etc.
  ],
  "flows": [
    { "name": "View Product Details", "description": "User filters products, clicks a product card, and views details in a modal.",
      "steps": [
        "User selects a category from 'categoryFilterSelect'.",
        "'filterCategory' state updates, 'productsData' (simulated) updates.",
        "'productListContainer' re-renders with filtered product cards.",
        "User clicks on a 'productCardExample'.",
        "'selectedProductId' state updates with the ID of the clicked product.",
        "'isModalOpen' state is set to true.",
        "'productDetailModal' becomes visible and displays details for 'selectedProductId'." ,
        "User clicks 'modalCloseButton'.",
        "'isModalOpen' state is set to false.",
        "'productDetailModal' hides."
      ]
    }
  ]
}
</example-dsl>

**Input for DSL Generation:**

User requirements:
{requirementsAnalysis}

Existing website artifacts (if any):
{artifactContent}

Reflections on previous changes:
{reflections}

**Final Output Reminder:**
Generate ONLY the single, complete, and valid JSON object representing the Web DSL. Ensure it is a rich and detailed representation of a highly interactive user interface that directly addresses the user's problem and meets all stated requirements.
`.trim();

export const UPDATE_ENTIRE_ARTIFACT_PROMPT = `You are a professional UI engineer specializing in creating and refining web interfaces.
Your primary goal is to produce a single, complete HTML file based on the provided <web-dsl> and <requirements-analysis>.

**Task Definition:**

*   **IF an existing artifact is provided in <artifact>{artifactContent}</artifact> (and it's not empty or a placeholder like 'No artifact yet'):**
    Your task is to **iteratively refine and improve** that existing artifact.
    1.  Analyze the <artifact>{artifactContent}</artifact> against the <web-dsl> and <requirements-analysis>.
    2.  Identify specific areas for improvement: gaps in DSL adherence, missing content, incomplete features, or violations of implementation rules.
    3.  Rewrite and enhance the code to fully align with the <web-dsl>, meet all requirements, and fix any issues. Preserve and build upon correct parts of the existing artifact.
    Your output must be the **complete, new version** of the HTML artifact with all improvements integrated.

*   **IF NO existing artifact is provided in <artifact>{artifactContent}</artifact> (i.e., it's empty or a placeholder indicating no prior artifact):**
    Your task is to **generate a new web interface from scratch**.
    1.  Base your generation primarily on the <web-dsl> as the source of truth for structure, content, and interactivity.
    2.  Ensure all <requirements-analysis> are met.
    3.  Your output must be a **complete, new HTML artifact**.

**Key Inputs:**

Analyzed Requirements:
<requirements-analysis>
{requirementsAnalysis}
</requirements-analysis>

Web DSL:
<web-dsl>
{webDSL}
</web-dsl>

Existing Artifact (if available, otherwise this will be empty or indicate no artifact):
<artifact>
{artifactContent}
</artifact>

Previous Evaluation Results (if available):
<evaluation-results>
{evaluationResults}
</evaluation-results>

**Core Implementation Rules (Mandatory for both tasks):**

<implementation-rules>
- The <web-dsl> is the primary reference. Your implementation MUST closely match its structure, content, and interactivity.

<html-rules>
${HTML_RULES}
</html-rules>
<actual-html-rules>
${ACTUAL_HTML_PROMPT_RULES}
</actual-html-rules>
<code-rules>
${CODE_PROMPT_RULES}
</code-rules>

</implementation-rules>

IMPORTANT: The following examples are for reference. Adapt patterns to the specific requirements, do not copy directly.
<examples>
${HTML_EXAMPLES}
</examples>

Reflections & User Preferences:
<reflections>
{reflections}
</reflections>

{updateMetaPrompt}

Additional Context (if available):
<web-search-results>
{webSearchResults}
</web-search-results>

Reminder: Your final response MUST be ONLY the complete HTML artifact. No extra text, no explanations.
`;

export const EVALUATION_METRICS_PROMPT = `Based on the user's specific requirements and the following analysis, 
generate appropriate evaluation metrics for a generative UI that directly addresses their needs:

Your task is to generate a set of metrics that will be used to evaluate the quality and effectiveness of the implementation.
Each metric should be structured as follows:
- name: A clear, descriptive name for the metric
- description: A detailed explanation of what this metric evaluates
- weight: A number between 0 and 1 indicating the importance of this metric
- criteria: A list of specific points to evaluate for this metric

{requirementsContext}

Focus on Generative UI specific metrics that:
1. Evaluate core functionality and web stability (highest priority)
   - Basic functionality working correctly
   - System stability and error handling
   - Cross-browser compatibility
   - Mobile responsiveness
2. Assess modern flat design implementation
   - Clean and minimalist interface
   - Consistent color scheme and typography
   - Proper use of white space
   - Visual hierarchy and balance
3. Measure interactive elements quality
   - Smooth animations and transitions
   - Intuitive user feedback
   - Interactive component responsiveness
   - Gesture support (if applicable)
4. Evaluate data visualization effectiveness
   - Clear and meaningful data presentation
   - Interactive data exploration
   - Responsive charts and graphs
   - Data update mechanisms
5. Assess performance and optimization
   - Page load speed
   - Animation performance
   - Resource optimization
   - Memory usage
6. Measure UI component quality
   - Component reusability
   - Design consistency
   - Accessibility compliance
   - Responsive behavior
7. Evaluate feature completeness
   - Implementation of all requested features
   - Integration with existing systems
   - Error handling coverage
   - Edge case handling

Ensure that:
1. The sum of all weights equals 1.0
2. Each metric has at least 3 specific criteria
3. Metrics are comprehensive and cover all important aspects of the implementation
4. Descriptions are clear and specific
5. Criteria are measurable and actionable`;

export const EVALUATION_PROMPT = `You are an expert evaluator tasked with analyzing and comparing HTML pages.

Requirements Analysis:
{requirementsContext}

User Preferences:
{reflectionsContext}

Evaluation Metrics:
{evaluationMetrics}

Articles to evaluate:
{articlesContent}

Evaluation Guidelines:
1. For each metric:
   - Score: 0-100 (100 being perfect)
   - Comment: One concise sentence (max 100 characters)
   - Focus on specific, measurable aspects

2. Content Preferences:
   - Score: 0-100 based on how well it matches user's content preferences
   - Comment: One sentence explaining the match

3. Style Preferences:
   - Score: 0-100 based on how well it matches user's style preferences
   - Comment: One sentence explaining the match

4. Overall Evaluation:
   - Total Score: 0-100
   - Strengths: List of one-sentence key strengths
   - Weaknesses: List of one-sentence key weaknesses

5. Best Article Selection:
   - Choose the article with highest total score
   - Provide one-sentence justification

Scoring Scale:
- 90-100: Excellent implementation
- 80-89: Very good implementation
- 70-79: Good implementation
- 60-69: Satisfactory implementation
- Below 60: Needs improvement

IMPORTANT:
- Keep all comments and justifications to one sentence
- Focus on specific, measurable aspects
- Be objective and consistent in scoring
- Consider both technical and user experience aspects
- Ensure content and style preferences are properly evaluated`;

export const VALIDATION_HTML_PROMPT = `You are a HTML formatter. Your task is to format the user's HTML content.

Rules:
1. Check if the HTML has proper structure (html, head, body tags)
2. If structure is incomplete, add necessary elements
3. If content is not wrapped in markdown code blocks (\`\`\`html and \`\`\`), wrap it
4. If content already has code blocks, keep them as is
5. Return ONLY the formatted HTML code, no explanations or additional text`;
