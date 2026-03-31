import React from "react";
import logo from "../assets/Logo_Wellness Group.png";
import bell from "../assets/Icon.png";
import user from "../assets/User Avatar.svg";

function Navbar() {
  return (
    <div className="bg-amber-950 px-5 py-4 flex items-center justify-between">
      <img src={logo} alt="Logo" />
      <div>
        <ul className="flex space-x-4 text-gray-300 font-medium">
          <li>Home</li>
          <li>Therapists</li>
          <li>Sales</li>
          <li>Clients</li>
          <li>Transactions</li>
          <li>Reports</li>
          <li>
            <img src={bell} alt="Bell" />
          </li>
          <li>
            <img src={user} alt="User" />
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Navbar;
