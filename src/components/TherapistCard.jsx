import React from "react";

const TherapistCard = (props) => {
  return (
    <div className="flex items-center px-2 py-2 ">
      <div
        className={`w-8 h-8 rounded-full ${props.gender === "male" ? "bg-[#3B82F6]" : "bg-[#EC4899]"} flex items-center justify-center text-white text-sm font-bold mr-2`}
      >
        {props.id}
      </div>
      <div className=" text-black font-semibold pr-8 leading-tight capitalize truncate">
        <h4>{props.alias}</h4>
        <p className="text-[.6rem]">{props.gender}</p>
      </div>
    </div>
  );
};

export default TherapistCard;
