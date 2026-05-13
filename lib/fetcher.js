export const fetcher = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const error = new Error("An error occurred while fetching the data.");
      error.info = await res.json();
      error.status = res.status;
      throw error;
    }
    return res.json();
  } catch (err) {
    if (!err.status) {
      err.status = "Network Error";
      err.info = err.message;
    }
    throw err;
  }
};
