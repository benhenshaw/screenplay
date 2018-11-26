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
var local_user_name = "Ben";
var local_input_type = "say"; // "say", "do";

name_display.innerHTML = local_user_name;
name_display.innerHTML = local_user_name;

input_type_display.innerHTML = `(${local_input_type})`;

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
        script.lastElementChild.innerHTML = old_text.concat(` Then ${text}`);
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

function handle_input(text)
{
    if (local_input_type === "say")
    {
        dialogue(local_user_name, text);
    }
    else
    {
        action(local_user_name, text);
    }
}

entry_input.addEventListener("keypress", (event) =>
{
    if (event.key === "Enter")
    {
        handle_input(entry_input.value);
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


// DEMO
title("The Mystery of the Black Lagoon");
scene("John and Mary's House", false);
description("It's late at night, and all is quiet. Strange sounds are coming\
    from the basement of John and Mary's house. Flashes of coloured light can\
    be seen from a small basement window.");
