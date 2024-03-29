use std::{fs::File, path::PathBuf};

use actix_files::NamedFile;
use actix_web::{web, App, HttpRequest, HttpResponse, HttpServer, Responder};

use num_complex::Complex;
use quantum_bits::QCS;
use serde::{Deserialize, Serialize};

extern crate quantum_bits;

#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
enum QuantumGate {
    Hadamard {
        wire: u8,
        time: u8,
    },
    Not {
        wire: u8,
        time: u8,
    },
    ControlledNot {
        wire: u8,
        control: u8,
        time: u8,
    },
    ControlledPhase {
        angle: f64,
        wire: u8,
        control: u8,
        time: u8,
    },
}

fn time_of(qg: QuantumGate) -> u8 {
    match qg {
        QuantumGate::Hadamard { wire, time } => time,
        QuantumGate::Not { wire, time } => time,
        QuantumGate::ControlledNot {
            wire,
            control,
            time,
        } => time,
        QuantumGate::ControlledPhase {
            angle,
            wire,
            control,
            time,
        } => time,
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Circuit {
    qubits: u8,
    gates: Vec<QuantumGate>,
}

async fn print_gates(circuit: web::Json<Circuit>) -> impl Responder {
    println!("{:?}", circuit);
    HttpResponse::Ok().finish()
}
async fn run_circuit(circuit: web::Json<Circuit>) -> impl Responder {
    println!("{:?}", circuit);
    let mut gates = circuit.gates.clone();
    gates.sort_by(|a, b| time_of(*a).cmp(&time_of(*b)));
    let mut qcirc = QCS::new(circuit.qubits);
    for gate in gates {
        match gate {
            QuantumGate::Not { wire, time: _time } => {
                qcirc = qcirc.not(wire);
            }
            QuantumGate::Hadamard { wire, time: _time } => {
                qcirc = qcirc.hadamard(wire);
            }
            QuantumGate::ControlledNot {
                wire,
                control,
                time: _time,
            } => {
                qcirc = qcirc.cnot(control, wire);
            }
            QuantumGate::ControlledPhase {
                angle,
                wire,
                control,
                time: _time,
            } => {
                qcirc = qcirc.controled_gate(&QCS::new(1).phase(angle), &[wire], &[control]);
            }
        }
    }
    let dimensions = 1 << circuit.qubits;
    let mut input = vec![Complex::new(0.0, 0.0); dimensions];
    input[0] = Complex::new(1.0, 0.0);
    let output = qcirc.run_once(&input);
    let output_str = format!("{:?}", output);
    HttpResponse::Ok()
        .content_type("application/json")
        .body(output_str)
}

async fn index(req: HttpRequest) -> actix_web::Result<NamedFile> {
    let path: PathBuf = req.match_info().query("filename").parse().unwrap();
    Ok(NamedFile::open(path)?)
}
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(web::resource("/print_gates").route(web::post().to(print_gates)))
            .service(web::resource("/run_circuit").route(web::post().to(run_circuit)))
            .route("/{filename:.*}", web::get().to(index))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
