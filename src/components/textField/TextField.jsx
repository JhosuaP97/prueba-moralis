import React from "react";
import "./TextFieldStyles.css";
const TextField = ({ type, placeholder, value, onChange, name }) => {
  return (
    <input
      className="text-field"
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
};

export default TextField;
