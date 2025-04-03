// ConfirmTransactionModal.jsx
import React from 'react';

const ConfirmTransactionModal = ({ show, onClose, onConfirm, transactionId }) => {
    if (!show) return null;

    return (
        <div className="modal-overlay w-[100%] left-0 z-50 fixed top-0 bg-[#1A1E2199]  flex items-center justify-center  h-[100vh]">
            <div className="modal-content h-[auto] bg-[#111518]  max-w-[500px] px-3 py-6 rounded-2xl text-center">
                <h2>Confirm Completion</h2>
                <p>Are you sure you want to complete transaction {transactionId}?</p>
                <button className='border-none outline-none rounded-xl px-5 bg-[#318AE6] m-3 text-[white] p-2' onClick={() => { onConfirm(transactionId); onClose(); }}>Confirm</button>
                <button className='border-none outline-none rounded-xl px-5 bg-[#318AE6] m-3 text-[white] p-2' onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

export default ConfirmTransactionModal;
