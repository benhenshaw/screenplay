// main.js
// Benedict Henshaw, 2019

let socket         = null;
let socket_handler = null;
let player_index   = -1;
let character      = null;
let script         = null;
let scene_counter  = 1;
let spectating     = false;
let input_area     = null;

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
        title("Ghosts in the Old Gold Mine");
        scene("Dirt Road in Dead Forest", false);
        description("The Mystery Mobile is seen driving along a dark and dusty road, surrounded by dead trees, "+
                    " moonlight illuminating the path. Here and there small glowing eyes peer at the gang "+
                    "as they drive by, and bats can be seen flying in the distant sky.");
        dialogue("Narrator", "Only days after successfully capturing the Ghastly Ghost of Ghoul Manor, "+
                             "Scoob and the gang are at it again. But will they pull it off this time?");
        description("The gang are on the search for treasure. They caught word that long ago some "+
                    "wealthy GOLD MINE owner lost her mind and fired all her workers, barricading "+
                    "herself into the mine, never to be seen again.");
        scene("Outside the Mine", false);
        description("After taking a few wrong turns, the gang have gotten themselves lost. "+
                    "The engine of their beloved van thuds and whimpers, coming to a halt. "+
                    "They're out of gas, but they've made it to the GOLD MINE. It's boarded up with old rotten wood.");
        button_prompt("Enter the GOLD MINE", true, () =>
        {
            send_message("description", `${character.short_name} decided that the gang should go into the GOLD MINE. `+
                "A gentle tug on the wooden boards causes them to fall apart, and the entryway is revealed.");
            send_message("scene", "Mine Shaft", true);
            send_message("description", "Using Velma's trusty flash-light, the gang venture deep into the mine in search "+
                "of gold, or mysterious clues. They reach an old room with some oak furniture, including a writing "+
                "desk, at which a SKELETON sits. A faintly GLOWING BOX rest upon the desk, covered in dust.");
            send_message("description", "It is very dark here, and the gang will certainly be lost forever if "+
                "their flash-light went out. It has SEVEN MINUTES of charge left.");
            send_message("flashlight");
            send_message("inside_mine", character.short_name);
        })
    },

    filter: (message) =>
    {
        if (message.type === "dialogue")
        {
            if (scenario.near_box && message.data[1].toLowerCase().includes("gimme the gold"))
            {
                description("Upon hearing the words \"gimme the gold\", The GLOWING BOX starts clicking, and the humming grows louder. "+
                            "After a few moments it is almost too much to bare.");
                description("The whole gang crowd around the box as it starts to open. The top splits in "+
                    "two, each piece falling to the side, revealing a pile of glistening GOLD NUGGETS.");
                description("The gang pocket as much gold as they can. In the background, a hidden "+
                            "door reveals itself, opening up to grant access to a stone staircase, "+
                            "descending into darkness.");

                for (let i = 0; i < scenario.characters.length; ++i)
                {
                    scenario.characters[i].questions[0].text =
                        "You, and the rest of the gang, managed to find the legendary gold!";
                }

                button_prompt_exclusive_pair(
                    "Take the DARK STAIRCASE", () =>
                    {
                        send_message("description",
                            `${character.short_name} decideds to lead the gang down the DARK STAIRCASE.`);
                        send_message("scene", "Stone Staircase", true);
                        send_message("description", "Stone steps echo every footstep as the gang descend deeper into the cavernous mine."+
                            "The flash-light flickers, as a distant voice is heard.");
                        send_message("dialogue", "Disembodied Voice", "Begone thieves! If you stray any closer to my dwelling "+
                            "I shall have to take your lives.");
                        send_message("staircase");
                    },
                    "Leave the GOLD MINE", () =>
                    {
                        send_message("left_mine");
                        send_message("description",
                            `${character.short_name} decideds that it is time to leave the mine and head home.`);
                        send_message("scene", "Outside the Mine", false);
                        send_message("description", "The gang emerge triumphant, gold in pocket, and head to the Mystery Machine. "+
                            "The sun is beginning to rise over the dead forest, and distant birds can be heard chirping.");
                        send_message("description", "Climbing inside, Daphne notices that they have a spare bottle of gas under the back seat. "+
                            "She goes out to fill up the tank.");
                        send_message("description", "With the van in working order, the gang drive off into the sunrise significantly richer, "+
                            "off to find another mystery to solve.");
                        send_message("end");
                    }
                );
            }
        }
        else if (message.type === "flashlight")
        {
            window.setTimeout(() => {if (!scenario.stop_countdown) description("The flash-light has SIX MINUTES of charge left.")},     1 * 60000);
            window.setTimeout(() => {if (!scenario.stop_countdown) description("The flash-light has FIVE MINUTES of charge left.")},    2 * 60000);
            window.setTimeout(() => {if (!scenario.stop_countdown) description("The flash-light has FOUR MINUTES of charge left.")},    3 * 60000);
            window.setTimeout(() => {if (!scenario.stop_countdown) description("The flash-light has THREE MINUTES of charge left.")},   4 * 60000);
            window.setTimeout(() => {if (!scenario.stop_countdown) description("The flash-light has TWO MINUTES of charge left.")},     5 * 60000);
            window.setTimeout(() => {if (!scenario.stop_countdown) description("The flash-light has ONE MINUTE of charge left.")},      6 * 60000);
            window.setTimeout(() => {if (!scenario.stop_countdown) description("The flash-light has THIRTY SECONDS of charge left.")},  7 * 60000 - 30000);
            window.setTimeout(() => {if (!scenario.stop_countdown) description("The flash-light has TEN SECONDS of charge left.")},     7 * 60000 - 10000);
            window.setTimeout(() =>
            {
                if (!scenario.stop_countdown)
                {
                    description("The flash-light has run out of charge. The gang are plunged into darkness, never to be seen again.");
                    trigger_end();
                }
            }, 7 * 60000);
        }
        else if (message.type === "inside_mine")
        {
            scenario.near_box = true;
            button_prompt_inclusive_pair(
                "Search SKELETON", () =>
                {
                    send_message("description", `The skeleton crumbles into dust the moment ${character.short_name} touches it.`);
                    send_message("description", "Among the dust a small note can be found. It has a poem of some sort, though "+
                        "almost all of it has faded away. The last few words can be read clearly, which are:");
                    send_message("description", "\"... gimme the gold.\"");
                },
                "Examine GLOWING BOX", () =>
                {
                    send_message("description",
                        `${character.short_name} brushes dust off the GLOWING BOX and takes a better look. `+
                        "It is small enough to hold in your hands. If listened to carefully "+
                        "one can hear faint humming; an old miner's song.");
                }
            );
        }
        else if (message.type === "left_mine")
        {
            scenario.stop_countdown = true;
            for (let i = 0; i < scenario.characters.length; ++i)
            {
                scenario.characters[i].questions[1].text = "You made it out of the mine alive!";
            }
        }
        else if (message.type === "staircase")
        {
            button_prompt_exclusive_pair(
                "Go DEEPER", () =>
                {
                    send_message("scene", "Stone Dungeon", true);
                    send_message("description", "The gang continues on into the depths of the mine. The steps of the staircase "+
                        "are wet here, with black mould growing along the edges. The flash-light flickers more the deeper they get.");
                    window.setTimeout(() =>
                    {
                        if (!scenario.reached_end)
                        {
                            send_message("description", "They continue walking down. As they get deeper the staircase starts to twist and turn.");
                        }
                    }, 5000);
                    window.setTimeout(() =>
                    {
                        if (!scenario.reached_end)
                        {
                            send_message("description", "The gang continue, despite seeing no end to the staircase.");
                        }
                    }, 15000);
                    window.setTimeout(() =>
                    {
                        if (!scenario.reached_end)
                        {
                            send_message("description", "Faint scratching sounds are heard.");
                        }
                    }, 30000);
                },
                "Leave the GOLD MINE", () =>
                {
                    send_message("left_mine");
                    send_message("description",
                        `${character.short_name} decideds that the gang should ascend the staircase, leave the GOLD MINE, and head home.`);
                    send_message("scene", "Outside the Mine", false);
                    send_message("description", "The gang emerge triumphant, gold in pocket, and head to the Mystery Machine. "+
                        "The sun is beginning to rise over the dead forest, and distant birds can be heard chirping.");
                    send_message("description", "Climbing inside, Daphne notices that they have a spare bottle of gas under the back seat. "+
                        "She goes out to fill up the tank.");
                    send_message("description", "With the van in working order, the gang drive off into the sunrise significantly richer, "+
                        "off to find another mystery to solve.");
                    send_message("end");
                }
            );
        }
        else if (message.type === "end")
        {
            scenario.stop_countdown = true;
            scenario.reached_end = true;
            trigger_end();
        }
    },

    characters:
    [
        {
            name: "Daphne Blake",
            short_name: "Daphne",
            description: "Daphne Blake is an enthusiastic but clumsy and danger-prone member of the gang, who always "+
                         "follows her intuition. She occasionally helps out by using some random, yet helpful, accessories "+
                         "from her purse. Daphne comes from a wealthy family. She has red hair and wears a lavender dress and shoes. "+
                         "Her catchphrase is \"Jeepers!\"",
            goals:
            [
                "Get the gold.",
                "Make it out alive.",
                "Use your catchphrase.",
                "Uncover the secrets of the old GOLD MINE."
            ],
            questions:
            [
                {question:"Get the gold.",type:"text",text:"You didn't find the gold."},
                {question:"Make it out alive.",type:"text",text:"You died in the GOLD MINE."},
                {question:"Use your catchphrase.",type:"text",text:"You never said \"Jeepers!\""},
                {question:"Uncover the secrets of the old GOLD MINE.",type:"text",text:"You didn't discover the mine's secrets."},
            ],
            filter: (message) =>
            {
                let me = scenario.characters[0];

                if (message.type === "dialogue")
                {
                    if (message.data[1].toLowerCase().includes("jeepers"))
                    {
                        if (!me.catchphrase_count) me.catchphrase_count = 0;
                        me.catchphrase_count++
                        me.questions[2].text = `You said \"Jeepers!\" ${me.catchphrase_count} times!`;
                    }
                }
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
                "Get the gold.",
                "Make it out alive.",
                "Use your catchphrase.",
                "Uncover the secrets of the old GOLD MINE."
            ],
            questions:
            [
                {question:"Get the gold.",type:"text",text:"You didn't find the gold."},
                {question:"Make it out alive.",type:"text",text:"You died in the GOLD MINE."},
                {question:"Use your catchphrase.",type:"text",text:"You never said \"Looks like we've got another mystery on our hands.\""},
                {question:"Uncover the secrets of the old GOLD MINE.",type:"text",text:"You didn't discover the mine's secrets."},
            ],
            filter: (message) =>
            {
                let me = scenario.characters[1];

                if (message.type === "dialogue")
                {
                    if (message.data[1].toLowerCase().includes("another mystery on our hands"))
                    {
                        if (!me.catchphrase_count) me.catchphrase_count = 0;
                        me.catchphrase_count++
                        me.questions[2].text = `You said \"Looks like we've got another mystery on our hands.\" ${me.catchphrase_count} times!`;
                    }
                }
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
                "Get the gold.",
                "Make it out alive.",
                "Use your catchphrase.",
                "Uncover the secrets of the old GOLD MINE."
            ],
            questions:
            [
                {question:"Get the gold.",type:"text",text:"You didn't find the gold."},
                {question:"Make it out alive.",type:"text",text:"You died in the GOLD MINE."},
                {question:"Use your catchphrase.",type:"text",text:"You never said \"Ruh roh Raggy!\""},
                {question:"Uncover the secrets of the old GOLD MINE.",type:"text",text:"You didn't discover the mine's secrets."},
            ],
            filter: (message) =>
            {
                let me = scenario.characters[2];

                if (message.type === "dialogue")
                {
                    if (message.data[1].toLowerCase().includes("ruh roh raggy"))
                    {
                        if (!me.catchphrase_count) me.catchphrase_count = 0;
                        me.catchphrase_count++
                        me.questions[2].text = `You said \"Ruh roh Raggy!\" ${me.catchphrase_count} times!`;
                    }
                }
            },
        },
        {
            name: "Shaggy Rogers",
            short_name: "Shaggy",
            description: "Norville \"Shaggy\" Rogers is a cowardly slacker and long-time best friend of Scooby-Doo. "+
                         "Shaggy has a characteristic speech pattern, marked by his frequent use of the filler word "+
                         " \"like\" and, when startled, his catchphrase \"Zoinks!\". His nickname derives from "+
                         "the shaggy style of his sandy-blond hair. "+
                         "Like Scooby-Doo, Shaggy is more interested in eating than solving mysteries.",
            goals:
            [
                "Get the gold.",
                "Make it out alive.",
                "Use your catchphrase.",
                "Use the word \"like\" more than once in a sentence.",
                "Uncover the secrets of the old GOLD MINE."
            ],
            questions:
            [
                {question:"Get the gold.",type:"text",text:"You didn't find the gold."},
                {question:"Make it out alive.",type:"text",text:"You died in the GOLD MINE."},
                {question:"Use your catchphrase.",type:"text",text:"You never said \"Zoinks!\""},
                {question:"Use the word \"like\" more than once in a sentence.",type:"text",text:"You never said \"like\" more than once in a sentence."},
                {question:"Uncover the secrets of the old GOLD MINE.",type:"text",text:"You didn't discover the mine's secrets."},
            ],
            filter: (message) =>
            {
                let me = scenario.characters[3];

                if (message.type === "dialogue")
                {
                    if (message.data[1].toLowerCase().includes("zoinks"))
                    {
                        if (!me.catchphrase_count) me.catchphrase_count = 0;
                        me.catchphrase_count++
                        me.questions[2].text = `You said \"Zoinks!\" ${me.catchphrase_count} times!`;
                    }
                    if (message.data[1].toLowerCase().includes("like"))
                    {
                        let like_count = count_substring(message.data[1].toLowerCase(), "like")
                        if (like_count > 1)
                        {
                            me.questions[3].text = `You said \"like\" ${like_count} times in one sentence!`;
                        }
                    }
                }
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
                "Get the gold.",
                "Make it out alive.",
                "Use your catchphrase.",
                "Mention your glasses.",
                "Uncover the secrets of the old GOLD MINE."
            ],
            questions:
            [
                {question:"Get the gold.",type:"text",text:"You didn't find the gold."},
                {question:"Make it out alive.",type:"text",text:"You died in the GOLD MINE."},
                {question:"Use your catchphrase.",type:"text",text:"You never said \"Jinkies!\"."},
                {question:"Mention your glasses.",type:"text",text:"You never mentioned your glasses."},
                {question:"Uncover the secrets of the old GOLD MINE.",type:"text",text:"You didn't discover the mine's secrets."},
            ],
            filter: (message) =>
            {
                let me = scenario.characters[4];

                if (message.type === "dialogue")
                {
                    if (message.data[1].toLowerCase().includes("jinkies"))
                    {
                        if (!me.catchphrase_count) me.catchphrase_count = 0;
                        me.catchphrase_count++
                        me.questions[2].text = `You said \"Jinkies!\" ${me.catchphrase_count} times!`;
                    }
                    if (message.data[1].toLowerCase().includes("glasses"))
                    {
                        if (!me.glasses_count) me.glasses_count = 0;
                        me.glasses_count += count_substring(message.data[1].toLowerCase(), "glasses");
                        me.questions[3].text = `You mentioned your glasses ${me.glasses_count} times!`;
                    }
                }
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

function send_message(type)
{
    let message =
    {
        type: type,
        data: [arguments[1],arguments[2],arguments[3],arguments[4],arguments[5]]
    };
    let message_json = JSON.stringify(message);
    socket.send(message_json);
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
        <h2>How To Play:</h2>
        <ol>
            <li>
                You will be given a character profile.<br>It contains the following:
                <ul>
                    <li>Name</li>
                    <li>Description</li>
                    <li>Goals</li>
                </ul>
            </li>
            <li>You will enter a session with other players.</li>
            <li>Fulfil your goals.</li>
        </ol>
        <h2>Notes:</h2>
        <ul>
            <li>Read your character profile carefully, and try to embody them.</li>
            <li>
                Choices may appear in the form of on-screen buttons.
                All choices affect all players, so communicate and work together as a team.
            </li>
            <li>Screenplays are traditionally written in PRESENT TENSE. Try to stick to this.</li>
            <li>Have fun!</li>
        </ul>
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
        parse_message(message);
        scenario.filter(message);
        character.filter(message);
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
            <h1>You Are: <span class="underline">${character.name}</span></h1>
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

    function parse_message(message)
    {
        switch (message.type)
        {
            case "title":       title(message.data[0]);                        break;
            case "dialogue":    dialogue(message.data[0], message.data[1]);    break;
            case "action":      action(message.data[0], message.data[1]);      break;
            case "scene":       scene(message.data[0], message.data[1]);       break;
            case "description": description(message.data[0], message.data[1]); break;
            case "disable":
                {
                    let e = document.getElementById(message.data[0]);
                    if (e) e.disabled = true;
                }
            break;
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

function button_prompt(text, send_disable, func)
{
    let id = text.replace(/ /g,'') + "_button";
    script.insertAdjacentHTML("beforeend",
    `<div class="flex button_prompt">
        <button id="${id}">${text}</button>
    </div>`);
    let button = document.getElementById(id);
    button.onclick = () =>
    {
        func();
        button.disabled = true;
        if (send_disable) send_message("disable", id);
    }
}

function button_prompt_exclusive_pair(text1,func1,text2,func2)
{
    let id1 = text1.replace(/ /g,'') + "_button";
    let id2 = text2.replace(/ /g,'') + "_button";

    script.insertAdjacentHTML("beforeend",
    `<div class="flex button_prompt">
        <button id="${id1}">${text1}</button>
        <button id="${id2}">${text2}</button>
    </div>`);

    let button1 = document.getElementById(id1);
    button1.onclick = () =>
    {
        func1();
        button1.disabled = true;
        button2.disabled = true;
        send_message("disable", id1);
        send_message("disable", id2);
    }

    let button2 = document.getElementById(id2);
    button2.onclick = () =>
    {
        func2();
        button1.disabled = true;
        button2.disabled = true;
        send_message("disable", id1);
        send_message("disable", id2);
    }
}

function button_prompt_inclusive_pair(text1,func1,text2,func2)
{
    let id1 = text1.replace(/ /g,'') + "_button";
    let id2 = text2.replace(/ /g,'') + "_button";

    script.insertAdjacentHTML("beforeend",
    `<div class="flex button_prompt">
        <button id="${id1}">${text1}</button>
        <button id="${id2}">${text2}</button>
    </div>`);

    let button1 = document.getElementById(id1);
    button1.onclick = () =>
    {
        func1();
        button1.disabled = true;
        send_message("disable", id1);
    }

    let button2 = document.getElementById(id2);
    button2.onclick = () =>
    {
        func2();
        button2.disabled = true;
        send_message("disable", id2);
    }
}

function trigger_end()
{
    input_area.innerHTML = "";
    button_prompt("Go to Summary", false, summary_mode);
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
        <p>The game has ended; thank you so much for playing! Now, let's see how well you did.</p>
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

    // let submit_button = document.createElement("button");
    // submit_button.setAttribute("class", "submit_button");
    // submit_button.innerHTML = "Submit";

    // submit_button.onclick = (event) =>
    // {
    //     for (let query of queries)
    //     {
    //         inputs = document.querySelectorAll(`[name=\"${query.question}\"]`);
    //         let type = inputs[0].getAttribute("type");
    //         if (type === "radio")
    //         {
    //             for (let option of inputs)
    //             {
    //                 if (option.checked)
    //                 {
    //                     if (query.answer === option.value)
    //                     {
    //                         queries.correct = true;
    //                         console.log("Correct:", query.question);
    //                     }
    //                 }
    //             }
    //         }
    //         else if (type === "text")
    //         {
    //             for (let option of inputs)
    //             {
    //                 if (option.value === query.answer)
    //                 {
    //                     queries.correct = true;
    //                     console.log("Correct:", query.question);
    //                 }
    //             }
    //         }
    //     }
    // };

    menu.appendChild(question_list);
    // menu.appendChild(submit_button);
    document.body.appendChild(menu);
}

function count_substring(haystack, needle) {
    var count = 0;
    var position = 0;
    while (true)
    {
        position = haystack.indexOf(needle, position);
        if (position != -1)
        {
            count++;
            position += needle.length;
        }
        else
        {
            break;
        }
    }
    return count;
};


window.onload = main
