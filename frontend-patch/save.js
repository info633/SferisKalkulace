// save.js — přidá tlačítko „Uložit kalkulaci“ a volá API s Bearer tokenem
import { auth } from './auth.js';
import { getIdToken } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';

// === Nastavte základ URL pro API (Cloud Run nebo localhost) ===
const API_BASE = window.SFERIS_API_BASE || 'http://localhost:8080';

function ensureSaveButton() {
  const wrap = document.querySelector('.pdf-export');
  if (!wrap) return;
  if (document.getElementById('btnSaveCalc')) return;

  const btn = document.createElement('button');
  btn.className = 'btn-primary';
  btn.id = 'btnSaveCalc';
  btn.style.marginLeft = '.6rem';
  btn.innerHTML = '<i class="fas fa-save"></i> Uložit kalkulaci';
  wrap.appendChild(btn);

  btn.addEventListener('click', onSave);
}

async function onSave() {
  try {
    const user = auth.currentUser;
    if (!user) {
      alert('Nejste přihlášen/a.');
      return;
    }
    const token = await user.getIdToken();
    // Tyto globální struktury už existují ve vašem kódu:
    // - vybranaOpatreni (položky)
    // - calculationData (součty)
    // - select #dotaceTyp (typ dotace)
    const schemeId = document.getElementById('dotaceTyp')?.value || 'none';

    const payload = {
      pricebookId: 'default',
      schemeId,
      measures: window.vybranaOpatreni || [],
      totals: window.calculationData || {},
      energy: window.energyResult || {},
      meta: {
        client: {
          firstName: document.getElementById('klient-jmeno')?.value || '',
          lastName:  document.getElementById('klient-prijmeni')?.value || '',
          email:     document.getElementById('klient-email')?.value || '',
          phone:     document.getElementById('klient-telefon')?.value || ''
        },
        object: {
          address: document.getElementById('obj-adresa')?.value || '',
          type:    document.getElementById('obj-typ')?.value || 'rd'
        }
      }
    };

    const res = await fetch(`${API_BASE}/v1/calculations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Nepodařilo se uložit kalkulaci');
    alert(`Kalkulace uložena (ID: ${data.id})`);
    // Volitelně: přesměrovat na přehled
    // window.location.href = 'saved.html';
  } catch (e) {
    console.error(e);
    alert('Chyba při ukládání kalkulace.');
  }
}

document.addEventListener('DOMContentLoaded', ensureSaveButton);
