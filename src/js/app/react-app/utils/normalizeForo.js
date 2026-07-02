const normalizeForo = (foro = "foroscomun") => {
  if (
    !foro ||
    foro === "admin" ||
    foro === "ciudadanos" ||
    foro === "jsgritos"
  ) {
    return "foroscomun";
  }
  return foro;
};

export default normalizeForo;
