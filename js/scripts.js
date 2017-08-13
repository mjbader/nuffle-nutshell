
let replayInput = document.getElementById("replay-file-input");

// Includes:
// Team Info Objects.  TV. Race. Team Name, Fame
// Competition and League Name
// Stadium Name
// Coach Names
//
var replayInfo = null;

let teamStat0 = {
    blocks: {
        all: [0,0,0,0,0],
        one: [0,0,0,0,0],
        two: [
            [0],
            [0,0],
            [0,0,0],
            [0,0,0,0],
            [0,0,0,0,0],
        ],
        results: [0,0,0,0], // failed, bothdown, push, knocked down
    },
    rolls: new Array(61)
};
let teamStat1 = {
    blocks: {
        all: [0,0,0,0,0],
        one: [0,0,0,0,0],
        two: [
            [0],
            [0,0],
            [0,0,0],
            [0,0,0,0],
            [0,0,0,0,0],
        ],
        results: [0,0,0,0],
    },
    rolls: new Array(61)
};

let statsInfo = [teamStat0, teamStat1];

let rollType = {
    noUse: -1,
    d6: 0,
    block: 1,
    d6d6: 2,
    d6d8: 3,
};

let blockType = {
    neg3D: -2,
    halfD: -1,
    result: 0,
    oneD: 1,
    twoD: 2,
    threeD: 3,
    allBlocks: 4,
}

function returnRollType(rollTypeNum) {
    switch(rollTypeNum) {
        case 1:
        case 2:
        case 6:
        case 7:
        case 9:
        case 12:
        case 16:
        case 20:
        case 21:
        case 22:
        case 23:
        case 24:
        case 25:
        case 27:
        case 29:
        case 31:
        case 34:
        case 36:
        case 37:
        case 40:
        case 42:
        case 45:
        case 46:
        case 54:
        case 55:
        case 56:
            return rollType.d6;
        case 5:
            return rollType.block;
        case 3:
        case 4:
            return rollType.d6d6;
        case 8:
            return rollType.d6d8;
        default:
            return rollType.noUse;
    }
}

function getRaceName(id) {
    switch (id) {
        case 1: return 'Human';
        case 2: return 'Dwarf';
        case 3: return 'Skaven';
        case 4: return 'Orc';
        case 5: return 'Lizardman';
        case 7: return 'Wood Elf';
        case 8: return 'Chaos';
        case 9: return 'Dark Elf';
        case 10: return 'Undead';
        case 12: return 'Norse';
        case 15: return 'High Elf';
        case 16: return 'Khemri';
        case 17: return 'Necromantic';
        case 18: return 'Nurgle';
        case 21: return 'Chaos Dwarf';
        case 24: return 'Bretonnian';
        default: return id;
    }
}

function getRollName(rollTypeNum) {
	switch (rollTypeNum) {
		case 1: return 'GFI';
		case 2: return 'Dodge';
		case 3: return 'Armour';
		case 4: return 'Injury';
		case 5: return 'Block';
		case 6: return 'Stand Up';
		case 7: return 'Pickup';
		case 8: return 'Casualty';
		case 9: return 'Catch';
		case 12: return 'Pass';
		case 16: return 'Intercept';
		case 17: return 'Wake-Up After KO';
		case 20: return 'Bone-Head';
		case 21: return 'Really Stupid';
		case 22: return 'Wild Animal';
		case 23: return 'Loner';
		case 24: return 'Landing';
        case 25: return 'Regeneration';
		case 29: return 'Dauntless';
		case 27: return 'Always Hungry';
		case 31: return 'Jump Up';
		case 34: return 'Stab';
		case 36: return 'Leap';
		case 37: return 'Foul Appearance';
		case 40: return 'Take Root';
		case 42: return 'Hail Mary Pass';
		case 45: return 'Pro';
		case 46: return 'Hypnotic Gaze';
		case 54: return 'Fireball';
		case 55: return 'Lightning Bolt';
		case 56: return 'Throw Team-Mate';
		case 59: return 'Armour';
		case 60: return 'Injury';
		default: return rollTypeNum;
	}
}


replayInput.addEventListener('change', () => {
    if (replayInput.files.length != 1) {
        return;
    }

    $("#spinner").removeClass('hidden');
    $("#replay-input").addClass('hidden');

    // Unzip the bbrz file
    var zipFile = new JSZip();
    zipFile.loadAsync(replayInput.files[0])
    .then((zip)=> {
        zip.forEach((relativePath, zipEntry) => {
            zipEntry.async('string').then((replay)=> {
                var replayXML = stringToXML(replay);
                parseReplay(replayXML);
            });
        })
    });
})

function parseReplay(xml) {
    let replay = xml.childNodes[0];
    for (index in replay.childNodes) {
        let child = replay.childNodes[index];
        if (child.tagName == 'ReplayStep') {
            parseStep(child);
        }
        if (index == replay.childNodes.length - 2) {
            // Record the score
            let homeScore = parseInt(getXMLElement(child, 'HomeScore').textContent);
            let awayScore = parseInt(getXMLElement(child, 'AwayScore').textContent);
            replayInfo.teams[0].score = homeScore;
            replayInfo.teams[1].score = awayScore;
        }
    }

    $("#spinner").addClass('hidden');
    $("#summary").removeClass('hidden');

    // Fill in game summary
    $("#league-name").text(replayInfo.nameLeague);
    $("#comp-name").text(replayInfo.compName);

    $("#home-name").text(replayInfo.teams[0].name);
    $("#home-race").text(replayInfo.teams[0].race);
    $("#home-tv").text(replayInfo.teams[0].teamValue);
    $("#home-fame").text(replayInfo.teams[0].fame);
    $("#home-score").text(replayInfo.teams[0].score);

    $("#away-name").text(replayInfo.teams[1].name);
    $("#away-race").text(replayInfo.teams[1].race);
    $("#away-tv").text(replayInfo.teams[1].teamValue);
    $("#away-fame").text(replayInfo.teams[1].fame);
    $("#away-score").text(replayInfo.teams[1].score);

    // Render Charts for block dice
    renderChart(5, blockType.oneD);
    // Reduce twoD blocks to a single array
    statsInfo[0].blocks.two = statsInfo[0].blocks.two.reduce( (a,b) => { return a.concat(b) });
    statsInfo[1].blocks.two = statsInfo[1].blocks.two.reduce( (a,b) => { return a.concat(b) });
    renderChart(5, blockType.twoD);
    renderChart(5, blockType.result);
    renderChart(5, blockType.allBlocks);

    // Render Charts for standard rolls
    for (index in statsInfo[0].rolls) {
        renderChart(parseInt(index));
    }
}

let diceNumLabels = ['1', '2', '3', '4', '5', '6'];
let twoDiceNumLabels = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
let blockDiceLabels = ['Attacker Down', 'Both Down', 'Push', 'Defender Stumbles', 'Defender Down'];
let twoDBlockDiceLabels = ['AD AD', 'AD BD', 'BD BD', 'AD P', 'BD P', 'P P',
                            'AD DS', 'BD DS', 'P DS', 'DS DS', 'A D', 'BD D', 'P D', 'DS D', 'D D']
let resultBlockLabels = ['Attacker Down','Both Downed','Neutral','Knockdown']
let casualtyLabels = ['Badly Hurt', 'Miss Next Game', 'Niggling Injury', '-MA', '-AV', '-AG', '-STR', 'Dead']

function returnData(type, block) {
    var data = {
        datasets: [{
            label: replayInfo.teams[0].name,
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            borderColor: 'rgba(255, 0, 0, 1)',
            borderWidth: 1,
        },
        {
            label: replayInfo.teams[1].name,
            backgroundColor: 'rgba(0, 0, 255, 0.2)',
            borderColor: 'rgba(0, 0, 255, 1)',
            borderWidth: 1,
        },
        ]
    };
    data.labels = returnLabel(type, block);
    switch(returnRollType(type)) {
        case rollType.d6:
        case rollType.d6d6:
        case rollType.d6d8:
            data.datasets[0].data = statsInfo[0].rolls[type];
            data.datasets[1].data = statsInfo[1].rolls[type];
            break;
        case rollType.block:
            switch(block) {
                case blockType.oneD:
                    data.datasets[0].data = statsInfo[0].blocks.one;
                    data.datasets[1].data = statsInfo[1].blocks.one;
                    break;
                case blockType.twoD:
                    data.datasets[0].data = statsInfo[0].blocks.two;
                    data.datasets[1].data = statsInfo[1].blocks.two;
                    break;
                case blockType.result:
                    data.datasets[0].data = statsInfo[0].blocks.results;
                    data.datasets[1].data = statsInfo[1].blocks.results;
                    break;
                case blockType.allBlocks:
                    data.datasets[0].data = statsInfo[0].blocks.all;
                    data.datasets[1].data = statsInfo[1].blocks.all;
                    break;
            }
    }
    return data;
}

function returnDataPercentage(data, type, block) {
    var percentData = JSON.parse(JSON.stringify(data));
    percentData.datasets[0].data = percentifyData(percentData.datasets[0].data);
    percentData.datasets[1].data = percentifyData(percentData.datasets[1].data);
    return percentData;
}

function percentifyData(data) {
    let sum = data.reduce((total,a) => {return total + a})
    if (sum < 1) {
        return data;
    } else {
        return data.map((a) => { return ((a/sum)*100).toFixed(2) });
    }
}

function returnLabel(type, block) {
    switch(returnRollType(type)) {
        case rollType.d6:
            return diceNumLabels;
        case rollType.d6d6:
            return twoDiceNumLabels;
        case rollType.d6d8:
            return casualtyLabels;
        case rollType.block:
            switch(block) {
                case blockType.oneD:
                    return blockDiceLabels;
                case blockType.twoD:
                    return twoDBlockDiceLabels;
                case blockType.result:
                    return resultBlockLabels;
                case blockType.allBlocks:
                    return blockDiceLabels;
            }
    }
}

function returnTitle(type, block) {
    switch(returnRollType(type)) {
        case rollType.d6:
        case rollType.d6d6:
        case rollType.d6d8:
            return getRollName(type) + " Rolls";
        case rollType.block:
            switch(block) {
                case blockType.oneD:
                    return '1D Blocks';
                case blockType.twoD:
                    return '2D Blocks';
                case blockType.result:
                    return 'Block Results';
                case blockType.allBlocks:
                    return 'Total Block Dice';
            }
    }
}

function returnOptions(type, block) {
    var options = {
        responsive: true,
        maintainAspectRatio: false,
        title: {
            display: true,
            text: returnTitle(type, block),
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true,
                    callback: function(value) {if (value % 1 === 0) {return value;}}
                }
            }],
        }
    };
    return options;
}

function returnOptionsPercentage(data, type, block) {
    var options = {
        responsive: true,
        maintainAspectRatio: false,
        title: {
            display: true,
            text: '% of ' + returnTitle(type, block),
        },
        scales: {
            yAxes: [{
                ticks: {
                    callback: function(value) {
                        return value + "%"
                    }
                },
                scaleLabel: {
                    display: true,
                    labelString: "Percentage"
                }
            }],
        }
    };
    return options;
}


function renderChart(type, block) {
    var div = document.createElement('div');
    div.id = "wrapper";
    div.style.cssText = "position: relative; height: 300px; width: 500px;";
    var ctx = document.createElement('canvas');
    ctx.id = `${type}-roll`;
    div.appendChild(ctx);
    let rootDiv = document.getElementById('dice-rolls')
    rootDiv.appendChild(div);
    let data = returnData(type, block);
    let options = returnOptions(type, block);

    // Render Percentage Chart
    var divPercent = document.createElement('div');
    divPercent.id = "wrapper";
    divPercent.style.cssText = "position: relative; height: 300px; width: 500px;";
    var ctxPercent = document.createElement('canvas');
    ctxPercent.id = `${type}-percentage`;
    divPercent.appendChild(ctxPercent);
    let rootPercentDiv = document.getElementById('dice-percentage')
    rootPercentDiv.appendChild(divPercent);
    let dataPercent = returnDataPercentage(data, type, block);
    let optionsPercent = returnOptionsPercentage(data, type, block);

    var rollChart = new Chart(
        ctx,
        {
            type: 'bar',
            data: data,
            options: options
        }
    );
    var percentChart = new Chart(
        ctxPercent,
        {
            type: 'bar',
            data: dataPercent,
            options: optionsPercent
        }
    );
}

function parseStep(step) {
    if (!replayInfo) {
        replayInfo = generateGameInfo(step);
    }
    let actions =  step.getElementsByTagName('RulesEventBoardAction');
    let activeTeamXML = getXMLElement(step, 'ActiveTeam');
    var activeTeam = activeTeamXML ? parseInt(activeTeamXML.textContent) : 0;
    for (var i = 0; i < actions.length; ++i) {
        parseRulesEventBoardAction(actions[i], statsInfo[activeTeam]);
    }
}

function parseRulesEventBoardAction(action, team) {
    let results = action.getElementsByTagName('BoardActionResult');
    for (var i = 0; i < results.length; ++i) {
        parseBoardActionResult(results[i], team);
    }
}

function parseBoardActionResult(result, team) {
    let rollType =  result.getElementsByTagName('RollType');
    if (rollType.length > 0) {
        var rollInt = parseInt(rollType[0].textContent);
        interpretRoll(rollInt, result, team);
    }
}

function interpretRoll(roll, result, team) {
    let actionResult = getXMLElement(result, 'ListDices');
    if (actionResult == undefined) {
        // No dice in result.  Skip
        return;
    }
    let dice = arrayifyDice(actionResult.textContent);
    switch(returnRollType(roll)) {
        case rollType.d6:
            let requirement = parseInt(getXMLElement(result, 'Requirement').textContent);
            let modifiers = getXMLElement(result, 'ListModifiers').getElementsByTagName('Value');
            var modifier = 0;
            if (modifiers.length != 0) {
                modifier =  Array.from(modifiers).reduce((total, a) => { return total + parseInt(a.textContent) }, modifier);
            }
            if (team.rolls[roll] == undefined) {
                // Instantiate both so that we can interate over one to create the charts to render
                statsInfo[0].rolls[roll] = [0,0,0,0,0,0];
                statsInfo[1].rolls[roll] = [0,0,0,0,0,0];
            }
            team.rolls[roll][dice[0]-1] += 1;
            break;
        
        case rollType.d6d6:
            if (team.rolls[roll] == undefined) {
                // Instantiate both so that we can interate over one to create the charts to render
                statsInfo[0].rolls[roll] = [0,0,0,0,0,0,0,0,0,0,0];
                statsInfo[1].rolls[roll] = [0,0,0,0,0,0,0,0,0,0,0];
            }
            let sum = dice.reduce((a,b) => {return a + b});
            team.rolls[roll][sum-2] += 1;
            break;
        
        case rollType.d6d8:
            if (team.rolls[roll] == undefined) {
                // Instantiate both so that we can interate over one to create the charts to render
                statsInfo[0].rolls[roll] = [0,0,0,0,0,0,0,0];
                statsInfo[1].rolls[roll] = [0,0,0,0,0,0,0,0];
            }
            if (getXMLElement(result, 'IsOrderCompleted')) {
                if (dice[0] < 41) {
                    team.rolls[roll][0] += 1;
                } else if (dice[0] < 51 ) {
                    team.rolls[roll][1] += 1;
                } else if (dice[0] < 53) {
                    team.rolls[roll][2] += 1;
                } else if (dice[0] < 55) {
                    team.rolls[roll][3] += 1;
                } else if (dice[0] < 57) {
                    team.rolls[roll][4] += 1;
                } else if (dice[0] < 58) {
                    team.rolls[roll][5] += 1;
                } else if (dice[0] < 61) {
                    team.rolls[roll][6] += 1;
                } else {
                    team.rolls[roll][7] += 1;
                }
            }
            break;

        case rollType.block: // Block dice
            if (getXMLElement(result, 'IsOrderCompleted')) {
                // The Selection and result of the selected block die

                let blockResult = interpretBlockResult(dice[1]);
                team.blocks.results[blockResult] += 1;
            } else {
                // The rolls for the dice themselves
                // Ex: (3, 0, 6, 0) is a 2D block
                // First 2 are the rolls, last 2 are the results
                if (dice.length == 2) {
                    team.blocks.one[dice[0]] += 1;
                    team.blocks.all[dice[0]] += 1;
                } else if (dice.length == 4) {
                    let blockRolls = dice.slice(0,2).sort(function(a, b){return b-a});
                    team.blocks.two[blockRolls[0]][blockRolls[1]] += 1;
                    for (let i in blockRolls) {
                       team.blocks.all[blockRolls[i]] += 1;
                    }
                } else if (dice.length == 6) {
                    let blockRolls = dice.slice(0,3).sort(function(a, b){return b-a});
                    // TODO record 3D blocks
                    for (let i in blockRolls) {
                       team.blocks.all[blockRolls[i]] += 1;
                    }
                }
            }
            break;
            
    }
}

let blockResult = {
    ATTACKERDOWN: 0,
    BOTHDOWN: 1,
    PUSH: 2,
    DEFENDERDOWN: 3,
};

function interpretBlockResult(num) {
    switch(num) {
        case 0: // Attacker Downed
            return blockResult.ATTACKERDOWN;
        case 2:
            return blockResult.BOTHDOWN;
        case 3: // Defender with skill pushed (Stand firm)
        case 4: // Defender Pushed
            return blockResult.PUSH;
        case 5: // Defender downed in place
        case 6: // Defender Pow'ed or Stumbled and pushed
            return blockResult.DEFENDERDOWN;
    }
}

function arrayifyDice(xmlString) {
    let splitted = xmlString.substring(1, xmlString.length - 1).split(',')
    return splitted.map((num) => { return parseInt(num) })
}

function generateGameInfo(firstStep) {
    var infoObject = {teams: []};
    let boardState = getXMLElement(firstStep, 'BoardState');
    let gameInfo = getXMLElement(firstStep,'GameInfos');
    let leagueObject = getXMLElement(gameInfo,'RowLeague');
    let competitionObject = getXMLElement(gameInfo,'RowCompetition');
    infoObject.nameLeague = getXMLElement(leagueObject,'Name').textContent;
    infoObject.compName = getXMLElement(competitionObject,'Name').textContent
    infoObject.nameStadium = getXMLElement(gameInfo,'NameStadium').textContent;
    let teamStates = boardState.getElementsByTagName('TeamState');
    let coachInfos = gameInfo.getElementsByTagName('CoachInfos');
    for (var i = 0; i < teamStates.length; ++i) {
        let team = generateTeam(teamStates[i]);
        team.coachName = getXMLElement(coachInfos[i], 'UserId').textContent; // Pull the coach name
        infoObject.teams.push(team);
    }
    return infoObject;
}

function generateTeam(teamState) {
    var data;
    for (i in teamState.children) {
        if (teamState.children[i].nodeName == 'Data') {
            data = teamState.childNodes[i];
            break;
        }

    }
    let fame = getXMLElement(teamState, 'Fame');
    return {
        race: getRaceName(parseInt(getXMLElement(data, 'IdRace').textContent)),
        name: getXMLElement(data, 'Name').textContent,
        teamValue: getXMLElement(data, 'Value').textContent,
        fame: fame ? fame.textContent : 0,
        stats: {},
    };
}

// Returns the first element retrieved by getElementsByTagName.
// If none found returns null
function getXMLElement(xmlObject, tag) {
    let element = xmlObject.getElementsByTagName(tag);
    if (element.length > 0) {
        return element[0];
    }
    return null;
}

function stringToXML(text) {
    var parser = new DOMParser();
    return parser.parseFromString(text, 'text/xml'); 
}