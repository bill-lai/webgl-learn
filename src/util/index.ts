export * from "./gl";
export * from "./math-2d";
export * from "./math-3d";
export * from "./mt4";
export * from "./resource";
export * from "./scene-graph";
export * from "./shaperes";
export * from "./gl-attrib";
export * from "./gl-object";
export * from "./bind-mouse";
export * from "./parse-obj";
export * from "./text-texture";
export * from "./bind-keyboard";
export * from "./bind-fps-camera";

export const frameRender = <T extends Array<any>, R>(
  render: (now: number, ...args: T) => R
) => {
  let currentPromise: Promise<R> | null = null;
  const startRender = (args: T) => {
    currentPromise = new Promise<R>((resolve) => {
      requestAnimationFrame((now) => {
        let result: R;
        try {
          result = render(now, ...args);
        } catch (e) {
          console.error(e);
        }
        resolve(result!);
        currentPromise = null;
      });
    });
  };
  return (...args: T) => {
    if (!currentPromise) {
      startRender(args);
    }
    return currentPromise!;
  };
};

export const startAnimation = (fn: (now: number) => void) => {
  let stop = false;
  const run = (now: number) => {
    if (stop) return;
    fn(now);
    requestAnimationFrame(run);
  };
  requestAnimationFrame(run);
  return () => (stop = true);
};

export const mergeFuns = (...fns: (() => void)[]) => {
  return () => {
    fns.forEach((fn) => fn());
  };
};

// 日期格式化
export const formatDate = (date: Date, fmt: string = "yyyy-MM-dd hh:mm") => {
  const map = {
    "M+": date.getMonth() + 1, //月份
    "d+": date.getDate(), //日
    "h+": date.getHours(), //小时
    "m+": date.getMinutes(), //分
    "s+": date.getSeconds(), //秒
    "q+": Math.floor((date.getMonth() + 3) / 3), //季度
    S: date.getMilliseconds(), //毫秒
  };

  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      date
        .getFullYear()
        .toString()
        .substr(4 - RegExp.$1.length)
    );
  }

  (Object.keys(map) as Array<keyof typeof map>).forEach((k) => {
    if (new RegExp("(" + k + ")").test(fmt)) {
      const val = map[k].toString();
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? val : ("00" + val).substr(val.length)
      );
    }
  });

  return fmt;
};
export * from "./cameraDebugger";
