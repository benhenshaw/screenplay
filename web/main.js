// main.js
// Benedict Henshaw, 2019

let socket         = null;
let socket_handler = null;
let player_index   = -1;
let character      = null;
let script         = null;
let scene_counter  = 1;
let spectating     = false;

//
// Scenario.
//
// Here is all the scenario-specific code. Ideally, this will live
// somewhere else and can be hot-loaded when a player enters a play
// session. For this initial demo it lives here in hard-coded form.
//

let scenario =
{
    start: () =>
    {
        title("Ghosts in the Cavern");
        scene("Abandoned Mine", true);
        description("The gang are in an abandoned mine.");
    },

    filter: (message) =>
    {
        if (message.type === "dialogue")
        {
            if (message.data[0] == "Fred Jones")
            {
                description("Fred talks too loud, and the cave crumbles from the reverberations.");
                title("------ Game Over ------");
                window.setTimeout(summary_mode, 5000);
            }
        }
    },

    characters:
    [
        {
            name: "Daphne Blake",
            short_name: "Daphne",
            description: "Daphne Blake is an enthusiastic but clumsy and danger-prone member of the gang, who always "+
                         "follows her intuition. She occasionally helps out by using some random, yet helpful, accessories"+
                         "from her purse. Daphne comes from a wealthy family. She has red hair and wears a lavender dress and shoes."+
                         "Her catchphrase is \"Jeepers!\"",
            goals:
            [
                "Open the magic door.",
                "Use your catchphrase.",
            ],
            questions:
            [
                {question:"Open the magic door.",type:"text",text:"You, and the rest of the gang, managed to open the door!"},
                {question:"Use your catchphrase.",type:"text",text:"You never said \"Jeepers!\""},
            ],
            filter: (message) =>
            {

            },
        },
        {
            name: "Fred Jones",
            short_name: "Fred",
            description: "Frederick Herman Jones wears a white and blue shirt and blue jeans. "+
                         "Although generally a nice person, Fred can be a scatterbrain at times. He can also "+
                         "be quite bossy and will force Shaggy and Scooby to hang around until the mystery is solved. "+
                         "His catchphrase is: \"Looks like we've got another mystery on our hands.\"",
            goals:
            [
                "Open the magic door.",
                "Use your catchphrase.",
            ],
            questions:
            [
                {question:"Open the magic door.",type:"text",text:"You, and the rest of the gang, managed to open the door!"},
                {question:"Use your catchphrase.",type:"text",text:"You never said \"Looks like we've got another mystery on our hands.\""},
            ],
            filter: (message) =>
            {

            },
        },
        {
            name: "Scooby-Doo",
            short_name: "Scooby",
            description: "Scooby-Doo is a cowardly Great Dane (dog) who can speak in broken English. Scooby is brown "+
                         "with several distinctive black spots on his upper body. He has a black nose and wears an "+
                         "off-yellow, diamond-shaped-tagged blue collar imprinted with  \"SD\". "+
                         "He is very fond of Scooby Snacks. His catchphrase is: \"Ruh roh Raggy!\"",
            goals:
            [
                "Open the magic door.",
                "Eat some Scooby Snacks.",
                "Use your catchphrase.",
            ],
            questions:
            [
                {question:"Open the magic door.",type:"text",text:"You, and the rest of the gang, managed to open the door!"},
                {question:"Use your catchphrase.",type:"text",text:"You never said \"Ruh roh Raggy!\""},
            ],
            filter: (message) =>
            {

            },
        },
        {
            name: "Shaggy Rogers",
            short_name: "Shaggy",
            description: "Norville \"Shaggy\" Rogers is a cowardly slacker and long-time best friend of Scooby-Doo. "+
                         "Shaggy has a characteristic speech pattern, marked by his frequent use of the filler word"+
                         " \"like\" and, when startled, his catchphrase \"Zoinks!\". His nickname derives from "+
                         "the shaggy style of his sandy-blond hair."+
                         "Like Scooby-Doo, Shaggy is more interested in eating than solving mysteries.",
            goals:
            [
                "Open the magic door.",
                "Eat some Scooby Snacks.",
                "Use the word \"like\" more than once in a sentence.",
                "Use your catchphrase.",
            ],
            questions:
            [
                {question:"Open the magic door.",type:"text",text:"You, and the rest of the gang, managed to open the door!"},
            ],
            filter: (message) =>
            {

            },
        },
        {
            name: "Velma Dinkley",
            short_name: "Velma",
            description: "Velma Dinkley is a highly intelligent young woman with a love of books. She is severely near-sighted, "+
                         "so cannot see anything without her glasses. She carries a backpack with many useful items inside, "+
                         "including a box of Scooby Snacks, with which she often bribes Shaggy and Scooby. "+
                         "Her catchphrase is: \"Jinkies!\". She often exclaims \"My glasses! I can't see without my glasses!\"",
            goals:
            [
                "Open the magic door.",
                "Use your catchphrase.",
                "Mention your glasses.",
            ],
            questions:
            [
                {question:"Open the magic door.",type:"text",text:"You, and the rest of the gang, managed to open the door!"},
                {question:"Use your catchphrase.",type:"text",text:"You never said \"Jinkies!\"."},
                {question:"Mention your glasses.",type:"text",text:"You never mentioned your glasses."},
            ],
            filter: (message) =>
            {

            },
        },
    ],
};

//
// Engine.
//
// Scenario-independent code that runs the play experience.
//

function main()
{
    init_socket()
    start_mode()
    // summary_mode()
}

function scroll_to_bottom()
{
    let scroller = (document.scrollingElement || document.body);
    scroller.scrollTop = scroller.scrollHeight;
}

function init_socket()
{
    if (location.protocol == 'https:')
    {
        socket = new WebSocket(`wss://${window.location.host}/ws`);
    }
    else
    {
        socket = new WebSocket(`ws://${window.location.host}/ws`);
    }

    socket.onopen = (event) => console.log("Socket connected!");

    socket.onmessage = (event) =>
    {
        console.log(event.data)
        message = JSON.parse(event.data)
        console.log("parsed:", message)
        if (message && socket_handler)
        {
            socket_handler(message)
        }
    }
}

function start_mode()
{
    document.body.innerHTML = "";

    menu = document.createElement("div");
    menu.setAttribute("id", "menu");

    menu.innerHTML =
    `
        <h1>Welcome to Screen Play</h1>
        <hr>
        <ol>
            <li>
                You will be given a character profile.<br>It contains the following:
                <ul>
                    <li>Name</li>
                    <li>Description</li>
                    <li>Goals</li>
                </ul>
            </li>
            <li>You will enter a room with other players.</li>
            <li>Fulfil your goal.</li>
        </ol>
        <div class="flex">
            <button id="play_button">Play</button>
            <button id="spectate_button">Spectate</button>
        </div>
    `;

    document.body.appendChild(menu);

    socket_handler = (message) =>
    {
        if (message.type == "join")
        {
            if (message.player_index < scenario.characters.length)
            {
                character = scenario.characters[message.player_index];
                spectating = false;
                script_mode()
                return
            }
        }
        spectating = true;
        script_mode()
    };

    let play_button = document.getElementById("play_button");
    play_button.onclick = () => socket.send("ready");

    let spectate_button = document.getElementById("spectate_button");
    spectate_button.onclick = () => socket.send("spectating");
}

function script_mode()
{
    //
    // Server communication.
    //

    socket_handler = (message) => {
        scenario.filter(message);
        parse_message(message);
    }

    //
    // Document generation.
    //

    let wrapper = null;

    document.body.innerHTML = "";

    wrapper = document.createElement("div");
    wrapper.setAttribute("id", "wrapper");

    script = document.createElement("div");
    script.setAttribute("id", "script");

    let input_area;
    let profile_box;
    if (!spectating)
    {
        entry_input = document.createElement("input");
        entry_input.setAttribute("id", "entry");
        entry_input.setAttribute("type", "text");

        input_area = document.createElement("div");
        input_area.setAttribute("class", "flex");

        let goal_text = "<h2>Goals:</h2><ol>";
        for (let goal of character.goals)
        {
            goal_text += `<li class="goal">${goal}</li>`;
        }
        goal_text += "</ol>";

        profile_box = document.createElement("div");
        profile_box.setAttribute("id", "profile_box");
        profile_box.innerHTML =
        `
            <button id="hide_toggle">Hide</button>
            <h1 class="name">Profile: ${character.name}</h1>
            <span id="hidable_area">
                <p>${character.description}</p>
                ${goal_text}
            </span>
        `;

        let hide_toggle = profile_box.querySelector("button#hide_toggle");
        let hidable_area = profile_box.querySelector("span#hidable_area");
        hide_toggle.onclick = () =>
        {
            hidable_area.hidden = !hidable_area.hidden;
            if (hidable_area.hidden)
            {
                hide_toggle.innerHTML = "Show";
            }
            else
            {
                hide_toggle.innerHTML = "Hide";
            }
        }

        input_area.appendChild(entry_input);
    }

    wrapper.appendChild(script);
    if (!spectating)
    {
        wrapper.appendChild(document.createElement("hr"));
        wrapper.appendChild(input_area);
        wrapper.appendChild(profile_box);
    }
    document.body.appendChild(wrapper);

    //
    // Message handling.
    //

    function send_message(type, x, y)
    {
        let message = { type: type, data: [ x, y ] };
        let message_json = JSON.stringify(message);
        socket.send(message_json);
    }

    function parse_message(message)
    {
        switch (message.type)
        {
            case "title":       title(message.data[0]);                            break;
            case "dialogue":    dialogue(message.data[0], message.data[1]);        break;
            case "action":      action(message.data[0], message.data[1]);          break;
            case "scene":       scene(message.data[0], message.data[1] == "true"); break;
            case "description": description(message.data[0], message.data[1]);     break;
            default: console.error(`Unknown message type '${message.type}'.`);
        }
    }

    //
    // Input handling.
    //

    if (!spectating)
    {
        entry_input.onkeydown = (event) =>
        {
            if (event.key === "Enter" && entry_input.value !== "")
            {
                send_message("dialogue", character.name, entry_input.value);
                entry_input.value = "";
            }
        };
    }

    //
    // Start.
    //

    scenario.start()

    if (!spectating)
    {
        entry_input.focus();
    }
}

function format_name(name)
{
    return name.trim().toUpperCase();
}

function title(text)
{
    if (script.lastElementChild && script.lastElementChild.id === "script_title")
    {
         script.lastElementChild.innerHTML = `<h1 id="script_title">${text}</h1>`;
    }
    else
    {
        script.insertAdjacentHTML("afterbegin", `<h1 id="script_title">${text}</h1>`);
    }
    scroll_to_bottom();
}

function dialogue(name, text)
{
    let n = format_name(name);
    if (script.lastElementChild &&
        script.lastElementChild.className === "dialogue" &&
        script.lastElementChild.firstElementChild.innerHTML === n)
    {
        script.lastElementChild.insertAdjacentHTML("beforeend", `<p>${text}</p>`);
    }
    else
    {
        let s = `<div class="dialogue"><p class="name">${n}</p><p>${text}</p></div>`;
        script.insertAdjacentHTML("beforeend", s);
    }
    scroll_to_bottom();
}

function action(name, text)
{
    let n = format_name(name);
    if (script.lastElementChild &&
        script.lastElementChild.className === "action" &&
        script.lastElementChild.firstElementChild.innerHTML === n)
    {
        let old_text = script.lastElementChild.innerHTML;
        script.lastElementChild.innerHTML = old_text.concat(` <span class="name">${n}</span> ${text}`);
    }
    else
    {
        let s = `<p class="action"><span class="name">${n}</span> ${text}</p>`;
        script.insertAdjacentHTML("beforeend", s);
    }
    scroll_to_bottom();
}

function scene(location, inside)
{
    let intext = inside ? "INT" : "EXT";
    let s = `<p class="location"><span class="scene_number">${scene_counter}</span>${intext}. ${location.toUpperCase()}</p>`;
    script.insertAdjacentHTML("beforeend", s);
    ++scene_counter;
    scroll_to_bottom();
}

function description(text)
{
    let s = `<p class="description">${text}</p>`;
    script.insertAdjacentHTML("beforeend", s);
    scroll_to_bottom();
}

function summary_mode()
{
    document.body.innerHTML = "";

    menu = document.createElement("div");
    menu.setAttribute("id", "menu");

    menu.innerHTML =
    `
        <h1>Summary</h1>
        <hr>
        <p>The game has ended. Now, let's see if you achieved your goals.</p>
    `;

    let question_list = document.createElement("ol");

    queries = character.questions;

    // DEBUG
    // queries = [
    //     {question:"Was there a spoon?",type:"select",options:["Yes","No"],answer:"No"},
    //     {question:"Who did it?",type:"select",options:["Me","You","Nobody"],answer:"Me"},
    //     {question:"What is the codeword?",type:"text_entry",answer:"fart"},
    //     {question:"Open the hidden safe.",type:"text",text:"You did it!"},
    // ];

    for (let query of queries)
    {
        let question_box = document.createElement("li");
        question_box.setAttribute("class", "summary_question");

        let question_text = document.createElement("p");
        question_text.setAttribute("class", "question_text");
        question_text.innerHTML = query.question;
        question_box.appendChild(question_text);

        if (query.type === "text")
        {
            let p = document.createElement("p");
            p.innerHTML = query.text;
            question_box.appendChild(p);
        }
        else if (query.type === "select")
        {
            for (let i in query.options)
            {
                let question_input = document.createElement("input");
                let option = query.options[i];
                question_input.setAttribute("class", "option_radio");
                question_input.setAttribute("type", "radio");
                question_input.setAttribute("name", query.question);
                question_input.setAttribute("value", option);

                let option_text = document.createElement("label");
                option_text.setAttribute("class", "option_text");
                option_text.setAttribute("for", option);
                option_text.innerHTML = option;

                question_box.appendChild(question_input);
                question_box.appendChild(option_text);
                question_box.appendChild(document.createElement("br"));
            }
        }
        else if (query.type === "text_entry")
        {
            let entry = document.createElement("input");
            entry.setAttribute("type", "text");
            entry.setAttribute("name", query.question);
            question_box.appendChild(entry);
        }

        question_list.appendChild(question_box);
    }

    let submit_button = document.createElement("button");
    submit_button.setAttribute("class", "submit_button");
    submit_button.innerHTML = "Submit";

    submit_button.onclick = (event) =>
    {
        for (let query of queries)
        {
            inputs = document.querySelectorAll(`[name=\"${query.question}\"]`);
            let type = inputs[0].getAttribute("type");
            if (type === "radio")
            {
                for (let option of inputs)
                {
                    if (option.checked)
                    {
                        if (query.answer === option.value)
                        {
                            queries.correct = true;
                            console.log("Correct:", query.question);
                        }
                    }
                }
            }
            else if (type === "text")
            {
                for (let option of inputs)
                {
                    if (option.value === query.answer)
                    {
                        queries.correct = true;
                        console.log("Correct:", query.question);
                    }
                }
            }
        }
    };

    menu.appendChild(question_list);
    menu.appendChild(submit_button);
    document.body.appendChild(menu);
}

window.onload = main
