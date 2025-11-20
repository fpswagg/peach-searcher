export const wait = (time: number) =>
    new Promise((resolve, reject) => {
        try {
            setTimeout(resolve, time);
        } catch (error) {
            reject(error);
        }
    });
