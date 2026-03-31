import React from "react";
import TherapistCard from "./TherapistCard";

const TherapistList = ({ therapists = [], searchParam }) => {
  console.log(searchParam);
  return (
    <>
      {therapists.length > 0 ? (
        therapists.map((therapist) => (
          <TherapistCard
            key={therapist.id}
            id={therapist.id}
            alias={therapist.alias}
            gender={therapist.gender}
          />
        ))
      ) : (
        <p className="text-red-500">
          No therapists found for "<b>{searchParam}</b>"
        </p>
      )}
    </>
  );
};

export default TherapistList;
