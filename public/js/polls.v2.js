import { db, currentUser } from "./config.js";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentPollId = null;

export async function renderPolls() {
  const pollsSnap = await getDocs(
    query(collection(db, "polls"), orderBy("created_at", "desc"))
  );
  const polls = pollsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const usersSnap = await getDocs(collection(db, "users"));
  const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const usersMap = {};
  users.forEach((u) => {
    // Se non c'è nome o il nome è "Utente", usa la parte della email prima della @
    const hasValidName = u.name && u.name !== "Utente";
    usersMap[u.id] = hasValidName ? u.name : u.email.split("@")[0];
  });

  const now = new Date();
  const activePolls = polls.filter((p) => new Date(p.deadline) > now);
  const expiredPolls = polls.filter((p) => new Date(p.deadline) <= now);

  // Ottieni permessi utente
  const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  const userRole = userDoc.data()?.role || "base";
  const canCreate = ["segretario", "reviewer", "admin"].includes(userRole);

  return `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>📊 Sondaggi</h2>
            ${
              canCreate
                ? '<button class="btn btn-success" onclick="showPollModal()">+ Nuovo Sondaggio</button>'
                : ""
            }
        </div>
        
        ${
          activePolls.length > 0
            ? `
            <h4 class="text-success mb-3">📊 Sondaggi Attivi</h4>
            <div class="row">
                ${activePolls
                  .map((poll) => {
                    const hasVoted =
                      poll.votes && poll.votes[currentUser.uid] !== undefined;
                    const totalVotes = poll.votes
                      ? Object.keys(poll.votes).length
                      : 0;
                    return `
                        <div class="col-md-6 mb-3">
                            <div class="card border-success" style="cursor:pointer" onclick="showPollDetails('${
                              poll.id
                            }')">
                                <div class="card-body">
                                    <h5>${poll.question}</h5>
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <span class="badge bg-success">Attivo</span>
                                        ${
                                          hasVoted
                                            ? '<span class="badge bg-info">✓ Hai votato</span>'
                                            : '<span class="badge bg-warning">Non hai votato</span>'
                                        }
                                    </div>
                                    <small class="text-muted">📅 Scadenza: ${new Date(
                                      poll.deadline
                                    ).toLocaleDateString("it-IT", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}</small><br>
                                    <small class="text-muted">👥 ${totalVotes} voti su ${
                      users.length
                    } utenti</small>
                                </div>
                            </div>
                        </div>
                    `;
                  })
                  .join("")}
            </div>
        `
            : '<div class="alert alert-info">Nessun sondaggio attivo</div>'
        }
        
        ${
          expiredPolls.length > 0
            ? `
            <div class="card mt-4">
                <div class="card-header" style="cursor:pointer" onclick="toggleExpiredPolls()">
                    <h5 class="mb-0 text-muted">📁 Sondaggi Scaduti (${
                      expiredPolls.length
                    }) <span id="expired-icon" class="float-end">▼</span></h5>
                </div>
                <div id="expired-polls" class="collapse">
                    <div class="card-body">
                        <div class="row">
                            ${expiredPolls
                              .map((poll) => {
                                const totalVotes = poll.votes
                                  ? Object.keys(poll.votes).length
                                  : 0;
                                return `
                                    <div class="col-md-6 mb-3">
                                        <div class="card bg-light" style="cursor:pointer" onclick="showPollDetails('${
                                          poll.id
                                        }')">
                                            <div class="card-body">
                                                <h6 class="text-muted">${
                                                  poll.question
                                                }</h6>
                                                <span class="badge bg-secondary">Scaduto</span><br>
                                                <small>📅 ${new Date(
                                                  poll.deadline
                                                ).toLocaleDateString(
                                                  "it-IT"
                                                )}</small><br>
                                                <small class="text-muted">👥 ${totalVotes} voti</small>
                                            </div>
                                        </div>
                                    </div>
                                `;
                              })
                              .join("")}
                        </div>
                    </div>
                </div>
            </div>
        `
            : ""
        }
        
        <div class="modal fade" id="pollModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 id="pollModalTitle">Nuovo Sondaggio</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="poll-id">
                        <div class="mb-3">
                            <label class="form-label">Domanda</label>
                            <input type="text" id="poll-question" class="form-control" required placeholder="Inserisci la domanda del sondaggio">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Opzioni di Risposta</label>
                            <div id="poll-options-container">
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control poll-option" placeholder="Opzione 1" required>
                                    <button class="btn btn-outline-danger" type="button" onclick="removePollOption(this)" disabled>-</button>
                                </div>
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control poll-option" placeholder="Opzione 2" required>
                                    <button class="btn btn-outline-danger" type="button" onclick="removePollOption(this)" disabled>-</button>
                                </div>
                            </div>
                            <button type="button" class="btn btn-sm btn-outline-success" onclick="addPollOption()">+ Aggiungi Opzione</button>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Data di Scadenza</label>
                            <input type="datetime-local" id="poll-deadline" class="form-control" required>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                        <button type="button" class="btn btn-success" onclick="savePoll()">Salva</button>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="modal fade" id="pollDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 id="detailsPollTitle"></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="detailsPollBody"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.showPollModal = async () => {
  document.getElementById("poll-id").value = "";
  document.getElementById("poll-question").value = "";
  document.getElementById("pollModalTitle").textContent = "Nuovo Sondaggio";

  // Reset opzioni
  const container = document.getElementById("poll-options-container");
  container.innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control poll-option" placeholder="Opzione 1" required>
            <button class="btn btn-outline-danger" type="button" onclick="removePollOption(this)" disabled>-</button>
        </div>
        <div class="input-group mb-2">
            <input type="text" class="form-control poll-option" placeholder="Opzione 2" required>
            <button class="btn btn-outline-danger" type="button" onclick="removePollOption(this)" disabled>-</button>
        </div>
    `;

  // Imposta data minima (adesso + 1 ora)
  const now = new Date();
  const minDateTime = new Date(now.getTime() + 60 * 60 * 1000);
  const deadlineInput = document.getElementById("poll-deadline");
  deadlineInput.min = minDateTime.toISOString().slice(0, 16);
  deadlineInput.value = minDateTime.toISOString().slice(0, 16);

  new bootstrap.Modal(document.getElementById("pollModal")).show();
};

window.addPollOption = () => {
  const container = document.getElementById("poll-options-container");
  const optionCount = container.querySelectorAll(".poll-option").length + 1;
  const newOption = document.createElement("div");
  newOption.className = "input-group mb-2";
  newOption.innerHTML = `
        <input type="text" class="form-control poll-option" placeholder="Opzione ${optionCount}" required>
        <button class="btn btn-outline-danger" type="button" onclick="removePollOption(this)">-</button>
    `;
  container.appendChild(newOption);
  updateRemoveButtons();
};

window.removePollOption = (button) => {
  const container = document.getElementById("poll-options-container");
  button.parentElement.remove();
  // Rinumera placeholder
  container.querySelectorAll(".poll-option").forEach((input, index) => {
    input.placeholder = `Opzione ${index + 1}`;
  });
  updateRemoveButtons();
};

function updateRemoveButtons() {
  const container = document.getElementById("poll-options-container");
  const buttons = container.querySelectorAll(".btn-outline-danger");
  const canRemove = buttons.length > 2;
  buttons.forEach((btn) => {
    btn.disabled = !canRemove;
  });
}

window.savePoll = async () => {
  const question = document.getElementById("poll-question").value.trim();
  const deadline = document.getElementById("poll-deadline").value;
  const optionInputs = document.querySelectorAll(".poll-option");
  const options = Array.from(optionInputs)
    .map((input) => input.value.trim())
    .filter((opt) => opt !== "");

  if (!question) {
    alert("Inserisci una domanda!");
    return;
  }

  if (options.length < 2) {
    alert("Inserisci almeno 2 opzioni!");
    return;
  }

  if (!deadline) {
    alert("Inserisci una data di scadenza!");
    return;
  }

  const now = new Date();
  const minTime = new Date(now.getTime() + 60 * 60 * 1000);
  if (new Date(deadline) < minTime) {
    alert("La data di scadenza deve essere almeno 1 ora dopo adesso!");
    return;
  }

  const pollData = {
    question,
    options,
    deadline,
    votes: {},
    created_by: currentUser.uid,
    created_at: serverTimestamp(),
  };

  await addDoc(collection(db, "polls"), pollData);
  bootstrap.Modal.getInstance(document.getElementById("pollModal")).hide();
  showPage("polls");
};

window.showPollDetails = async (pollId) => {
  const pollsSnap = await getDocs(collection(db, "polls"));
  const poll = pollsSnap.docs.find((d) => d.id === pollId);
  if (!poll) return;

  const data = poll.data();
  currentPollId = pollId;

  const usersSnap = await getDocs(collection(db, "users"));
  const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const usersMap = {};
  users.forEach((u) => {
    // Se non c'è nome o il nome è "Utente", usa la parte della email prima della @
    const hasValidName = u.name && u.name !== "Utente";
    usersMap[u.id] = hasValidName
      ? u.name
      : u.email
      ? u.email.split("@")[0]
      : "Utente";
  });

  const isExpired = new Date(data.deadline) <= new Date();
  const hasVoted = data.votes && data.votes[currentUser.uid] !== undefined;
  const totalVotes = data.votes ? Object.keys(data.votes).length : 0;

  // Calcola risultati
  const results = data.options.map((option, index) => {
    const voters = data.votes
      ? Object.entries(data.votes)
          .filter(([uid, optIndex]) => optIndex === index)
          .map(([uid]) => uid)
      : [];
    return {
      option,
      count: voters.length,
      percentage:
        totalVotes > 0 ? ((voters.length / totalVotes) * 100).toFixed(1) : 0,
      voters: voters.map((uid) => usersMap[uid] || "Utente sconosciuto"),
    };
  });

  // Utenti che non hanno votato
  const votedUserIds = data.votes ? Object.keys(data.votes) : [];
  const notVotedUsers = users
    .filter((u) => !votedUserIds.includes(u.id))
    .map((u) => u.name);

  document.getElementById("detailsPollTitle").textContent = data.question;

  let bodyHTML = `
        <div class="mb-3">
            <span class="badge bg-${isExpired ? "secondary" : "success"}">${
    isExpired ? "Scaduto" : "Attivo"
  }</span>
            ${
              hasVoted
                ? '<span class="badge bg-info ms-2">✓ Hai votato</span>'
                : ""
            }
        </div>
        <p><strong>Scadenza:</strong> ${new Date(
          data.deadline
        ).toLocaleDateString("it-IT", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}</p>
        <p><strong>Totale voti:</strong> ${totalVotes} su ${
    users.length
  } utenti</p>
        <hr>
    `;

  if (!isExpired && !hasVoted) {
    bodyHTML += `
            <h6>Seleziona la tua risposta:</h6>
            <div class="list-group mb-3">
                ${data.options
                  .map(
                    (option, index) => `
                    <button type="button" class="list-group-item list-group-item-action" onclick="votePoll(${index})">
                        ${option}
                    </button>
                `
                  )
                  .join("")}
            </div>
        `;
  } else if (!isExpired && hasVoted) {
    bodyHTML += `
            <div class="alert alert-info">
                Hai già votato. Puoi cambiare il tuo voto finché il sondaggio è attivo.
            </div>
            <h6>Cambia la tua risposta:</h6>
            <div class="list-group mb-3">
                ${data.options
                  .map(
                    (option, index) => `
                    <button type="button" class="list-group-item list-group-item-action ${
                      data.votes[currentUser.uid] === index ? "active" : ""
                    }" onclick="votePoll(${index})">
                        ${option} ${
                      data.votes[currentUser.uid] === index
                        ? "(Tuo voto attuale)"
                        : ""
                    }
                    </button>
                `
                  )
                  .join("")}
            </div>
        `;
  }

  bodyHTML += `<hr><h6>Risultati:</h6>`;

  results.forEach((result) => {
    bodyHTML += `
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <strong>${result.option}</strong>
                    <span>${result.count} voti (${result.percentage}%)</span>
                </div>
                <div class="progress mb-2" style="height: 25px;">
                    <div class="progress-bar bg-success" role="progressbar" style="width: ${
                      result.percentage
                    }%" aria-valuenow="${
      result.percentage
    }" aria-valuemin="0" aria-valuemax="100">
                        ${result.percentage}%
                    </div>
                </div>
                ${
                  result.voters.length > 0
                    ? `
                    <small class="text-muted">
                        <strong>Hanno votato:</strong> ${result.voters.join(
                          ", "
                        )}
                    </small>
                `
                    : '<small class="text-muted">Nessun voto</small>'
                }
            </div>
        `;
  });

  if (notVotedUsers.length > 0) {
    bodyHTML += `
            <hr>
            <div class="alert alert-warning">
                <strong>⚠️ Non hanno ancora votato (${
                  notVotedUsers.length
                }):</strong><br>
                ${notVotedUsers.join(", ")}
            </div>
        `;
  }

  document.getElementById("detailsPollBody").innerHTML = bodyHTML;
  new bootstrap.Modal(document.getElementById("pollDetailsModal")).show();
};

window.votePoll = async (optionIndex) => {
  if (!currentPollId) return;

  const pollDoc = doc(db, "polls", currentPollId);
  const pollSnap = await getDoc(pollDoc);

  if (!pollSnap.exists()) {
    alert("Sondaggio non trovato!");
    return;
  }

  const pollData = pollSnap.data();

  // Verifica scadenza
  if (new Date(pollData.deadline) <= new Date()) {
    alert("Questo sondaggio è scaduto!");
    return;
  }

  // Aggiorna voto
  const votes = pollData.votes || {};
  votes[currentUser.uid] = optionIndex;

  await updateDoc(pollDoc, { votes });

  // Ricarica dettagli
  bootstrap.Modal.getInstance(
    document.getElementById("pollDetailsModal")
  ).hide();
  setTimeout(() => showPollDetails(currentPollId), 300);
};

window.toggleExpiredPolls = () => {
  const expired = document.getElementById("expired-polls");
  const icon = document.getElementById("expired-icon");
  if (expired.classList.contains("show")) {
    expired.classList.remove("show");
    icon.textContent = "▼";
  } else {
    expired.classList.add("show");
    icon.textContent = "▲";
  }
};
