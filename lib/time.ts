export function seconds(n = 1) {
    return n * 1000;
}

export function minutes(n = 1) {
    return n * seconds(60);
}

export function hours(n = 1) {
    return n * minutes(60);
}

export function days(n = 1) {
    return n * hours(24);
}

export function addMonth(time: Date, by: number) {
    let time_ = new Date(time);
    time_.setMonth(time_.getMonth() + by);
    return time_;
}

export function addYear(time: Date, by: number) {
    let time_ = new Date(time);
    time_.setFullYear(time_.getFullYear() + by);
    return time_;
}

export const timeResetOptions = {
    once: (time: number) => null,

    hourly: (time: number) => time + hours(),
    '2h': (time: number) => time + hours(2),
    '3h': (time: number) => time + hours(3),
    '4h': (time: number) => time + hours(4),
    '5h': (time: number) => time + hours(5),
    '6h': (time: number) => time + hours(6),
    '7h': (time: number) => time + hours(7),
    '8h': (time: number) => time + hours(8),
    '9h': (time: number) => time + hours(9),
    '10h': (time: number) => time + hours(10),
    '11h': (time: number) => time + hours(11),
    '12h': (time: number) => time + hours(12),
    '16h': (time: number) => time + hours(16),
    '18h': (time: number) => time + hours(18),
    '20h': (time: number) => time + hours(20),

    daily: (time: number) => time + days(),
    weekly: (time: number) => time + days(7),
    monthly: (time: number) => addMonth(new Date(time), 1).getTime(),
    yearly: (time: number) => addYear(new Date(time), 1).getTime(),

    biweekly: (time: number) => time + days(14),
    quarterly: (time: number) => addMonth(new Date(time), 3).getTime(),
    semiannually: (time: number) => addMonth(new Date(time), 6).getTime(),
    biennially: (time: number) => addYear(new Date(time), 2).getTime(),
    triennially: (time: number) => addYear(new Date(time), 3).getTime(),

    '30m': (time: number) => time + minutes(30),
    '45m': (time: number) => time + minutes(45),

    '2d': (time: number) => time + days(2),
    '3d': (time: number) => time + days(3),
    '5d': (time: number) => time + days(5),
};

export const timeResetOptionsKeys = Object.entries(timeResetOptions)
    .sort(([, a], [, b]) => (a(0) || 0) - (b(0) || 0))
    .map(([x]) => x);
