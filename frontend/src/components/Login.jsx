import React from 'react';
import { BASE_URL } from '../routes/App';

function Login({ USERS, setUser, setTab }) {
  return (
    <div className="login-screen">
      <h2>Login</h2>
      <form
        onSubmit={e => {
          e.preventDefault();
          const username = e.target.username.value;
          const password = e.target.password.value;

          if (USERS[username] && USERS[username].password === password) {
            localStorage.setItem('user', username);
            setUser(username);
            setTab(username === 'admin' || username === 'boss' ? 'Хамза' : USERS[username].tab);
          } else {
            alert("Invalid credentials");
          }

          fetch(`${BASE_URL}/log-event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: username, action: "login" })
          });
        }}
      >
        <input name="username" placeholder="Username" autoFocus />
        <input name="password" type="password" placeholder="Password" />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
