export let config: { [id: string]: string | undefined } = {
  BACKEND_URL: process.env.REACT_APP_BACKEND_URL
    ? process.env.REACT_APP_BACKEND_URL
    : ""
};
