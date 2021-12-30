import React from "react";

import "./ButtonStyles.css";

const Button = ({ type = "button", onClick, children }) => (
  <button class="btn" type={type} onClick={onClick}>
    {children}
  </button>
);
export default Button;
