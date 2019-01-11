/*
    Improv script game, by Benedict Henshaw
    main.js
*/

let scenario = {
    name: "",
    player_count: 0,
    skip_questions: false,
    characters:
    [
        {
            name: "",
            description: "",
            goals: [ "", "", ],
            verbs:
            [
                { verb: "", fn: (message)=>{} },
            ],
            questions:
            [
                { question:"",type:"",options:["",""],answer:"" },
            ],
        },
    ],
    objects:
    [

    ],
    incoming_filter: (message) =>
    {
        return message.type === "dialogue"
            && message.data[1].includes("magicword");
    },
    outgoing_filter: (message) => {},
};

let entry_input = null;
let socket = null;
let character_name = "Jane";
let character_action = "dialogue";

function main()
{
    init_socket();

    start_mode();
    // character_profile_mode();
    // script_mode();
    // question_mode();
    // results_mode();
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
    socket.onmessage = (event) => console.log(event.data);
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
                    <li>Goal</li>
                </ul>
            </li>
            <li>You will enter a room with other players.</li>
            <li>Fulfil your goal.</li>
        </ol>
        <div class="status_message">Waiting for more players...</div>
        <div class="flex">
            <button id="play_button">Play</button>
            <button id="spectate_button">Spectate</button>
        </div>
    `;

    document.body.appendChild(menu);

    let play_button = document.getElementById("play_button");
    let spectate_button = document.getElementById("spectate_button");

    let status_message = document.querySelector(".status_message");
    status_message.hidden = true;

    play_button.onclick = () =>
    {
        socket.send("ready");
        play_button.disabled = true;
        spectate_button.disabled = true;
        status_message.hidden = false;
    }

    spectate_button.onclick = () =>
    {
        socket.send("spectating");
        play_button.disabled = true;
        spectate_button.disabled = true;
        status_message.hidden = false;
    }

    socket.onmessage = (event) =>
    {
        console.log(event);
        let message = JSON.parse(event.data);
        if (message && message.type === "update" &&
            message.player_count && message.player_target)
        {
            status_message.innerHTML =
                `Waiting for more players... (%{message.player_count}/%{message.player_target})`;
        }
        else if (message && message.type === "ready" &&
            message.player_count && message.player_target)
        {
            status_message.innerHTML = `Ready! (%{message.player_count}/%{message.player_target})`;
            play_button.disabled = false;
            spectate_button.disabled = false;
            socket.send("{type:\"ready\"}");
        }
    };
}

function character_profile_mode()
{
    document.body.innerHTML = "";

    menu = document.createElement("div");
    menu.setAttribute("id", "menu");

    menu.innerHTML =
    `
        <h1>Character Profile</h1>
        <hr>
        <p>This is your character profile.</p>
    `;

    document.body.appendChild(menu);
}

function script_mode(spectating)
{
    //
    // Server communication.
    //

    socket.onmessage = (event) =>
    {
        console.log("Got: ", event.data);
        parse_message(event.data);
    };

    //
    // Document generation.
    //

    let wrapper       = null;
    let script        = null;
    let scene_counter = 1;

    document.body.innerHTML = "";

    wrapper = document.createElement("div");
    wrapper.setAttribute("id", "wrapper");

    script = document.createElement("div");
    script.setAttribute("id", "script");

    let input_area;
    if (!spectating)
    {
        entry_input = document.createElement("input");
        entry_input.setAttribute("id", "entry");
        entry_input.setAttribute("type", "text");

        input_area = document.createElement("div");
        input_area.setAttribute("class", "flex");

        let say_button = document.createElement("button");
        say_button.innerHTML = "Say";
        say_button.setAttribute("disabled", "true");

        let take_button = document.createElement("button");
        take_button.innerHTML = "Take";

        let give_button = document.createElement("button");
        give_button.innerHTML = "Give";

        input_area.appendChild(entry_input);
        input_area.appendChild(say_button);
        input_area.appendChild(take_button);
        input_area.appendChild(give_button);
    }

    wrapper.appendChild(script);
    if (!spectating)
    {
        wrapper.appendChild(document.createElement("hr"));
        wrapper.appendChild(input_area);
    }
    document.body.appendChild(wrapper);

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

    //
    // Message handling.
    //

    function send_message(type, x, y)
    {
        let message = { type: type, data: [ x, y ] };
        let message_json = JSON.stringify(message);
        socket.send(message_json);
    }

    function parse_message(message_json)
    {
        let message = JSON.parse(message_json);
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
            if (event.key === "Enter")
            {
                if (entry_input.value && entry_input.value !== "")
                {
                    send_message("dialogue", character_name, entry_input.value);
                    entry_input.value = "";
                }
            }
        };
    }

    //
    // DEBUG
    //

    {
        title("Tunnels Of Doom");
        scene("Dark Cave", true);
        description("The cave is quiet and too dark to see anything.");
        dialogue("ben", "Where are we?");
        action("ben", "feels around on the ground until finding a wall.");
        description("The wall gives way to another room. This room is lit by a single flaming torch mounted to the far wall.");
        scroll_to_bottom();

        scene("Light Cave", true);
        description("This cave has old bones all over the floor.");
        dialogue("ben", "Gross!");
        scroll_to_bottom();
    }

    if (!spectating)
    {
        entry_input.focus();
    }
}

function question_mode()
{
    document.body.innerHTML = "";

    menu = document.createElement("div");
    menu.setAttribute("id", "menu");

    menu.innerHTML =
    `
        <h1>Questions</h1>
        <hr>
        <p>The game has ended. Now, let's see if you achieved your goal. Answer the questions below.</p>
    `;

    let question_list = document.createElement("ol");

    // DEBUG
    queries =
    [
        {question:"Was there a spoon?",type:"select",options:["Yes","No"],answer:"No"},
        {question:"Who did it?",type:"select",options:["Me","You","Nobody"],answer:"Me"},
        {question:"What is the codeword?",type:"text_entry",answer:"fart"},
    ];

    for (let query of queries)
    {
        let question_box = document.createElement("li");
        question_box.setAttribute("class", "summary_question");

        let question_text = document.createElement("p");
        question_text.innerHTML = query.question;
        question_box.appendChild(question_text);

        if (query.type === "select")
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

function results_mode()
{
    document.body.innerHTML = "";

    menu = document.createElement("div");
    menu.setAttribute("id", "menu");

    menu.innerHTML =
    `
        <h1>Results</h1>
        <hr>
        <p>Here are the results...</p>
    `;

    document.body.appendChild(menu);
}

window.onload = main;
