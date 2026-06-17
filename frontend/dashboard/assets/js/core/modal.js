/**
 * modal.js - Modal Reusable
 * Buka, tutup, reset modal.
 */

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function closeModalOnClickOutside(modalId) {
    window.addEventListener('click', function(e) {
        const modal = document.getElementById(modalId);
        if (e.target === modal) closeModal(modalId);
    });
}

function setModalTitle(modalId, title) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const titleEl = modal.querySelector('.modal-title');
        if (titleEl) titleEl.textContent = title;
    }
}

function setSubmitButton(modalId, text) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const btn = modal.querySelector('.btn-simpan');
        if (btn) btn.textContent = text;
    }
}