/*
    Improv script game, by Benedict Henshaw
    main.js
*/

let entry_input = null;
let socket = null;
let character_name = "Jane";
let character_action = "dialogue";

function main()
{
    init_socket();
    menu_mode();
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
}

function menu_mode()
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

        <div class="flex">
            <button id="play_button">Play</button>
            <button id="spectate_button">Spectate</button>
        </div>
    `;

    document.body.appendChild(menu);

    let play_button = document.getElementById("play_button");
    let spectate_button = document.getElementById("spectate_button");

    play_button.onclick = () => script_mode(false);
    spectate_button.onclick = () => script_mode(true);
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

    let button_box;
    if (!spectating)
    {
        entry_input = document.createElement("input");
        entry_input.setAttribute("id", "entry");
        entry_input.setAttribute("type", "text");

        button_box = document.createElement("div");
        button_box.setAttribute("class", "flex");

        let say_button = document.createElement("button");
        say_button.innerHTML = "Say";
        say_button.setAttribute("disabled", "true");

        let take_button = document.createElement("button");
        take_button.innerHTML = "Take";

        let give_button = document.createElement("button");
        give_button.innerHTML = "Give";

        button_box.appendChild(say_button);
        button_box.appendChild(take_button);
        button_box.appendChild(give_button);
    }

    wrapper.appendChild(script);
    if (!spectating)
    {
        wrapper.appendChild(document.createElement("hr"));
        wrapper.appendChild(entry_input);
        wrapper.appendChild(button_box);
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
        title("Hello world.");
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

window.onload = main;
