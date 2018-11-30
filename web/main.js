/*
    Improv script game, by Benedict Henshaw
    main.js
*/

var script = document.getElementById("script");
var name_display = document.getElementById("name_display");
var quote_1 = document.getElementById("quote_1");
var quote_2 = document.getElementById("quote_2");
var entry_input = document.getElementById("entry");
var input_type_display = document.getElementById("input_type_display");
var scene_counter = 1;
var names = [ ];
// TODO: Build in-app name entry system.
var local_user_name = null;
while (local_user_name === null)
{
    local_user_name = prompt("Please enter your name.", "Mary");
}
var local_input_type = "say"; // "say", "do"
name_display.innerHTML = local_user_name;
name_display.innerHTML = local_user_name;
input_type_display.innerHTML = `(${local_input_type})`;

const socket = new WebSocket(`wss://${window.location.host}/ws`);

socket.addEventListener('open', function (event) {
    console.log("Socket connected!");
});

socket.addEventListener('message', function (event) {
    console.log("message: ", event.data);
    parse_message(event.data);
});

function format_and_add_name(name)
{
    var n = name.trim().toUpperCase();
    if (!names.includes(n)) names.push(n);
    return n;
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
}

function dialogue(name, text)
{
    var n = format_and_add_name(name);
    if (script.lastElementChild &&
        script.lastElementChild.className === "dialogue" &&
        script.lastElementChild.firstElementChild.innerHTML === n)
    {
        script.lastElementChild.insertAdjacentHTML("beforeend", `<p>${text}</p>`);
    }
    else
    {
        var s = `<div class="dialogue"><p class="name">${n}</p><p>${text}</p></div>`;
        script.insertAdjacentHTML("beforeend", s);
    }
}

function action(name, text)
{
    var n = format_and_add_name(name);
    if (script.lastElementChild &&
        script.lastElementChild.className === "action" &&
        script.lastElementChild.firstElementChild.innerHTML === n)
    {
        var old_text = script.lastElementChild.innerHTML;
        console.log(old_text);
        script.lastElementChild.innerHTML = old_text.concat(` <span class="name">${n}</span> ${text}`);
    }
    else
    {
        var s = `<p class="action"><span class="name">${n}</span> ${text}</p>`;
        script.insertAdjacentHTML("beforeend", s);
    }
}

function scene(location, inside)
{
    var intext = inside ? "INT" : "EXT";
    var s = `<p class="location"><span class="scene_number">${scene_counter}</span>${intext}. ${location.toUpperCase()}</p>`;
    script.insertAdjacentHTML("beforeend", s);
    ++scene_counter;
}

function description(text)
{
    var s = `<p class="description">${text}</p>`;
    script.insertAdjacentHTML("beforeend", s);
}

function build_message_from_input(text)
{
    var message = "";
    message += local_input_type;
    message += ","
    message += local_user_name;
    message += ","
    message += text;
    return message;
}

entry_input.addEventListener("keypress", (event) =>
{
    if (event.key === "Enter")
    {
        // handle_input(entry_input.value);
        m = build_message_from_input(entry_input.value);
        socket.send(m);
        // parse_message(m);
        entry_input.value = "";
        window.scrollTo(0,document.body.scrollHeight);
    }
    else if (event.key === "Tab")
    {
        event.preventDefault();
        local_input_type = local_input_type === "say" ? "do" : "say";
        if (local_input_type === "say")
        {
            name_display.innerHTML = local_user_name;
            quote_1.innerHTML = "&ldquo;";
            quote_2.innerHTML = "&rdquo;";
        }
        else
        {
            name_display.innerHTML = local_user_name;
            quote_1.innerHTML = "&MediumSpace;";
            quote_2.innerHTML = "&MediumSpace;";
        }
        input_type_display.innerHTML = `(${local_input_type})`;
    }
});

function parse_message(message)
{
    var args = message.split(",");
    console.log("message args:", args);
    var type = args[0];
    if (type === "title")       title(args[1]);
    if (type === "say")         dialogue(args[1], args[2]);
    if (type === "do")          action(args[1], args[2]);
    if (type === "scene")       scene(args[1], args[2] === "true");
    if (type === "description") description(args[1]);
}


// DEMO
title("The Mystery of the Black Lagoon");
scene("John and Mary's House", false);
description("It's late at night, and all is quiet. Strange sounds are coming\
    from the basement of John and Mary's house. Flashes of coloured light can\
    be seen from a small basement window.");
