import React from 'react'
import "../App.css"
import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <>
      <div className="landing-page-container">
        <nav className='navbar'>
          <div className='nav-logo'>
            <h2>MomentSync</h2>
          </div>
          <div className='nav-list'>
            <p>Join as Guest</p>
            <p>Register</p>
            <div role='button'>
              <Link to={"/login"}>Login</Link>
            </div>
          </div>
        </nav>

        <div className="landing-main-container">
          <div>
            <h1>Turning <span style={{color: "blueviolet"}}>miles</span> into <span style={{color: "crimson"}}>moments</span></h1>
            <p>From anywhere to everywhere , we bring you closer<br/>to your loved ones</p>
            <div role='button'>
              <Link to="/auth">Get Started</Link>
            </div>
          </div>
          <div>
            <img src="/mobile.png" alt="hi bro" />
          </div>
        </div>
      </div>
    </>
  )
}