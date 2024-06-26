var maxQubitsSupported = 7;
var maxStepsSupported = 20;
var circuitData = {
    "qubits": 1,
    "gates": [
    ],
    "taken": new Map()
};

function populateNumQubitsSelect() {
    const numQubitsSelect = document.getElementById('numQubitsSelect');
    for (let i = 1; i <= maxQubitsSupported; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.text = i + ' Qubits';
        numQubitsSelect.appendChild(option);
    }
}
populatePhaseSelect = () => {
    const phaseSelect = document.getElementById('phaseSelect');
    //first delete all options if any
    while (phaseSelect.firstChild) {
        phaseSelect.removeChild(phaseSelect.firstChild);
    }
    if (document.getElementById('gateTypeSelect').value === 'CPHASE' || document.getElementById('gateTypeSelect').value === 'PHASE') {
        for (let i = 0; i <= 10; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.text = '\u03C0/' + Math.pow(2,i);
            phaseSelect.appendChild(option);
        }
    }
}
function populateTimeSelect() {
    const timeSelect = document.getElementById('timeSelect');
    for (let i = 0; i < maxStepsSupported; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.text = 'Step ' + i;
        timeSelect.appendChild(option);
    }
}

function resetCircuit(numQubits) {
    circuitData = {
        "qubits": numQubits,
        "gates": [
        ],
        "taken": new Map()
    };
}
        
function onGateTypeChange() {
    populateControlSelect();
    populatePhaseSelect();
}

function displayResponse(response) {
    circuitData.output = response;
    drawCircuit(circuitData);
}

function populateQubitSelect(){

    const qubitSelect = document.getElementById('qubitSelect');
    //first delete all options if any
    while (qubitSelect.firstChild) {
        qubitSelect.removeChild(qubitSelect.firstChild);
    }
    for (let i = 0; i < circuitData.qubits; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.text = 'Qubit ' + i;
        qubitSelect.appendChild(option);
    }
}

populateControlSelect = () => {
    const gateType = document.getElementById('gateTypeSelect').value;
    const controlSelect = document.getElementById('controlSelect');
    //first delete all options if any
    while (controlSelect.firstChild) {
        controlSelect.removeChild(controlSelect.firstChild);
    }
    if (gateType === 'CX' || gateType === 'CPHASE') {
        for (let i = 0; i < circuitData.qubits; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.text = 'Control Qubit ' + i;
            controlSelect.appendChild(option);
        }
    }
}
function onNumQubitsChange() {
    const numQubits = parseInt(document.getElementById('numQubitsSelect').value);
    resetCircuit(numQubits);
    populateQubitSelect();
    populateTimeSelect();
    populateControlSelect();
    populatePhaseSelect();
    drawCircuit(circuitData);

}

function makeRestObject(circuit) {
    const restObject = {
        "qubits": circuit.qubits,
        "gates": []
    };
    typeMap = {
        'H': 'Hadamard',
        'X': 'Not',
        'CX': 'ControlledNot',
        'CPHASE': 'ControlledPhase',
        'PHASE': 'Phase'
    };
    circuit.gates.forEach(gate => {
        gateObject = {
            "type": typeMap[gate.type],
            "data": {
                "wire": gate.qubits[0],
                "time": gate.time,
            }
        };
        if (gate.type === 'CPHASE'|| gate.type === 'CX') {
            gateObject.data.control = gate.qubits[1];
        }
        if(gate.type === 'CPHASE' || gate.type === 'PHASE' ) {
            gateObject.data.angle = gate.angle;
        }
        restObject.gates.push(gateObject);
    });
    return restObject;
}

function sendCircuitToRun() {
    const restObject = makeRestObject(circuitData);
    //const xhr = new XMLHttpRequest();
    //xhr.open('POST', 'http://localhost:8080/run_circuit', true);
    //xhr.setRequestHeader('Content-Type', 'application/json');
    //xhr.send(JSON.stringify(restObject));

    fetch('http://localhost:8080/run_circuit', {
        method: 'POST', // or 'GET' if you are retrieving data
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(restObject), // convert the JavaScript object to a JSON string
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); // parse the JSON response body
    })
    .then(data => {
         // handle the parsed data
        displayResponse(data);
    })
    .catch(error => {
        console.error('There was a problem with your fetch operation:', error);
    });
}

function addGate() {
    const gateType = document.getElementById('gateTypeSelect').value;
    const qubit = parseInt(document.getElementById('qubitSelect').value);
    const control = parseInt(document.getElementById('controlSelect').value);
    const time = parseInt(document.getElementById('timeSelect').value);
    const phase = parseInt(document.getElementById('phaseSelect').value);
    if (circuitData.taken.get(qubit + '-' + time)) {
        alert('Qubit ' + qubit + ' already has a gate at time ' + time);
        return;
    }else if (gateType == 'CX' || gateType == 'CPHASE') {
        if (circuitData.taken.get(control + '-' + time)) {
            alert('Qubit ' + control + ' already has a gate at time ' + time);
            return;
        }
    }
    circuitData.taken.set(qubit + '-' + time, true);
    if (gateType == 'CX' || gateType == 'CPHASE') {
        circuitData.taken.set(control + '-' + time, true);
    }
    circuitData.gates.push({"type": gateType, "qubits": [qubit, control], "time": time, "angle": phase});
    drawCircuit(circuitData);
}
function drawCircuit(circuitData) {
    const canvas = document.getElementById('quantumCanvas');
    if (!canvas.getContext) {
        return; // Canvas not supported
    }
    const ctx = canvas.getContext('2d');
    const spacing = 30; // Space between qubit lines
    const gateWidth = 20;
    const startX = 20;
    const startY = 30;


    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let i = 0; i < 1000; i++);

    
    ctx.beginPath();
    // Draw qubit lines
    for (let i = 0; i < circuitData.qubits; i++) {
        const y = startY + i * spacing;
        ctx.moveTo(startX, y);
        ctx.lineTo(canvas.width - startX-20, y);
        ctx.stroke();
    }
    ctx.closePath();
    // Draw time lines

    for (let i = 0; i < maxStepsSupported; i++) {
	const x = startX + i * gateWidth * 2;
        ctx.beginPath();
        ctx.strokeStyle = '#DDDDDD'; 
	ctx.moveTo(x, startY);
	ctx.lineTo(x, startY + (circuitData.qubits-1) * spacing);
	ctx.font = '10px Arial';
	ctx.fillStyle = '#000000'; 
	ctx.fillText('' + i, x, 20);
	ctx.stroke();
	ctx.closePath();
    }
    
    ctx.strokeStyle = '#000000'; 
    // Draw gates
    circuitData.gates.forEach(gate => {
        qubit = gate.qubits[0];
        if (gate.qubits.length > 1) { 
            control = gate.qubits[1];
        } else {
            control = -1;
        }

        const gateX = startX + gate.time * gateWidth * 2; // Position gates with some spacing
        const gateY = startY + qubit * spacing; // Center gate on line

        const controlY = startY + control * spacing;

        // Connect control and target
        if (gate.qubits.length > 1) {
            const controlY = startY + control * spacing;
            const targetY = startY + qubit * spacing;
            ctx.beginPath();
            ctx.moveTo(gateX, controlY );
            ctx.lineTo(gateX, targetY );
            ctx.stroke();

            // Draw control
            ctx.beginPath();
            ctx.arc(gateX, controlY , 5, 0, 2 * Math.PI);
            ctx.fill();

        }

        switch (gate.type) {
            case 'H':
                ctx.fillStyle = '#FFFFFF'; 
                ctx.fillRect(gateX-10, gateY-10 , 20, 20);
                ctx.fillStyle = '#000000'; 
                ctx.strokeRect(gateX-10, gateY-10 , 20, 20);
                ctx.fillText('H', gateX-5, gateY+5);
                break;
            case 'X':
                ctx.fillStyle = '#FFFFFF'; 
                ctx.fillRect(gateX-10, gateY-10 , 20, 20);
                ctx.fillStyle = '#000000'; 
                ctx.strokeRect(gateX-10, gateY-10 , 20, 20);
                ctx.fillText('X', gateX-5, gateY+5);
                break;
            case 'CX':
                // Draw target if not the first qubit
                
                ctx.beginPath();
                ctx.arc(gateX, gateY, 5, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(gateX - 5, gateY);
                ctx.lineTo(gateX + 5, gateY);
                ctx.moveTo(gateX, gateY - 5);
                ctx.lineTo(gateX, gateY + 5);
                ctx.stroke();
                
                break;
            case 'CPHASE':
                ctx.fillStyle = '#FFFFFF'; 

                ctx.beginPath();
                ctx.arc(gateX, gateY , 10,0, 2*Math.PI);
                ctx.fill();

                ctx.fillStyle = '#000000'; 
                ctx.stroke();
                ctx.fillText(Math.pow(2,gate.angle), gateX-7, gateY+3);
                break;
            case 'PHASE':
                ctx.fillStyle = '#FFFFFF'; 

                ctx.beginPath();
                ctx.arc(gateX, gateY , 10,0, 2*Math.PI);
                ctx.fill();

                ctx.fillStyle = '#000000'; 
                ctx.stroke();
                ctx.fillText(Math.pow(2,gate.angle), gateX-7, gateY+3);
                break;
        }
        
    });
    //Draw the output if there is any
    if (circuitData.output){
        for (let i = 0; i < circuitData.output.length; i++) {
            ctx.fillText(circuitData.output[i], canvas.width - 20, startY + i * spacing);
        }
    }
}

 
