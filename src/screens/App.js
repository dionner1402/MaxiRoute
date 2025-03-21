// frontend/src/App.js
import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [name, setName] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/register', { name });
      setResponseMessage(response.data.message);
    } catch (error) {
      setResponseMessage('Error al registrar el nombre');
    }
  };

  return (
    <div>
      <h1>Registrar Nombre</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="Escribe tu nombre"
        />
        <button type="submit">Registrar</button>
      </form>
      {responseMessage && <p>{responseMessage}</p>}
    </div>
  );
}

export default App;
