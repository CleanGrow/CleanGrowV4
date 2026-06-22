import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBqmTTuImI3XryQ9D2X-eJ1yNrFfKtwvpM",
  authDomain: "cleangrow-8b552.firebaseapp.com",
  databaseURL: "https://cleangrow-8b552-default-rtdb.firebaseio.com",
  projectId: "cleangrow-8b552",
  storageBucket: "cleangrow-8b552.firebasestorage.app",
  messagingSenderId: "823736787199",
  appId: "1:823736787199:web:26c85a9bf702422e186cca"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function monitorar(caminho, elementoId, sufixo = "") {
    const elemento = document.getElementById(elementoId);
    if (!elemento) return;
    onValue(ref(db, caminho), (snapshot) => {
        const valor = snapshot.val();
        elemento.textContent = valor !== null ? valor + sufixo : "--";
    });
}

monitorar("amb_temp", "amb_temp", "°C");
monitorar("amb_umid", "amb_umid", "%");

onValue(ref(db, "amb_chuva"), (snapshot) => {
    const el = document.getElementById("amb_chuva");
    if (!el) return;
    el.textContent = snapshot.val() == 1 ? "🌧 Chovendo" : "☀ Sem chuva";
});

monitorar("comp_temp", "comp_temp", "°C");
monitorar("comp_umid", "comp_umid", "%");
monitorar("comp_gas", "comp_gas");

monitorar("minh_temp", "minh_temp", "°C");
monitorar("minh_umid", "minh_umid", "%");
monitorar("minh_gas", "minh_gas");

onValue(ref(db, "res_nivel"), (snapshot) => {
    const nivel = snapshot.val() || 0;
    const texto = document.getElementById("res_nivel");
    const barra = document.getElementById("nivelBar");
    if (texto) texto.textContent = nivel + "%";
    if (barra) barra.style.height = nivel + "%";
});

onValue(ref(db, "stat_irrig"), (snapshot) => {
    const el = document.getElementById("stat_irrig");
    if (!el) return;
    el.textContent = snapshot.val() == 1 ? "🟢 Ligada" : "🔴 Desligada";
});

onValue(ref(db, "stat_valv"), (snapshot) => {
    const el = document.getElementById("stat_valv");
    if (!el) return;
    el.textContent = snapshot.val() == 1 ? "🟢 Aberta" : "🔴 Fechada";
});

const btn = document.getElementById("btnIrrigar");

if (btn) {
    onValue(ref(db, "stat_irrig"), (snapshot) => {
        const irrigando = Number(snapshot.val()) === 1;
        btn.disabled = irrigando;
        btn.textContent = irrigando ? "💧 Irrigando..." : "💧 Irrigar Agora";
    });

    btn.addEventListener("click", async () => {
        try {
            await set(ref(db, "cmd_irrig"), 1);
        } catch (err) {
            console.error("Erro ao enviar:", err);
        }
    });
}


// Monitoramento de emergência
let alertaEmergenciaAtivo = false;

onValue(ref(db, "sis_emergencia"), (snapshot) => {
    const valor = Number(snapshot.val());

    if (valor === 1 && !alertaEmergenciaAtivo) {
        alertaEmergenciaAtivo = true;

        const popup = document.createElement("div");
        popup.id = "popupEmergencia";
        popup.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100%;height:100%;
                        background:rgba(0,0,0,0.65);display:flex;
                        justify-content:flex-end;align-items:flex-start;padding:20px;
                        z-index:99999;">
                <div style="background:#c62828;padding:18px;border-radius:10px;
                            max-width:420px;text-align:center;
                            box-shadow:0 0 20px rgba(0,0,0,0.3);">
                    <h2 style="color:#fff;margin:0;">Situação Crítica</h2>
                    <button id="fecharEmergencia"
                            style="padding:10px 20px;border:none;border-radius:8px;
                                   cursor:pointer;">
                        Entendi
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(popup);

        document.getElementById("fecharEmergencia").onclick = () => {
            popup.remove();
        };
    }

    if (valor === 0) {
        alertaEmergenciaAtivo = false;
        const popup = document.getElementById("popupEmergencia");
        if (popup) popup.remove();
    }
});
