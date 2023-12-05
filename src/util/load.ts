import axios from "axios";

type LoadResource = Promise<string[]> & { continue: (exts: string[]) => LoadResource }

export const loadResource = (
  href: string,
  exts: string[] = [],
  includeSelf = true
): LoadResource => {
  const url = new URL(href, location.href);
  const paths = url.pathname.split("/");
  const getHref = (ext: string) => {
    const reqPaths = paths.slice(0, paths.length - 1)
    reqPaths[reqPaths.length] = paths[paths.length - 1] + (ext ? `.${ext}` : ext);
    url.pathname = reqPaths.join("/");
    return url.href;
  };

  let extIndex;
  if ((extIndex = paths.lastIndexOf(".")) !== -1) {
    const nameRaw = paths[paths.length - 1];
    paths[paths.length - 1] = nameRaw.substring(0, extIndex);
    if (includeSelf) {
      const nameExt = nameRaw.substring(extIndex + 1);
      if (nameExt && !exts.includes(nameExt)) {
        exts.push(nameExt);
      }
    }
  } else if (includeSelf) {
    exts.push("");
  }

  const reqs = exts.map((ext) => {
    const href = getHref(ext);
    return axios.get<string>(href).then((res) => {
      if (res.status === 200) {
        return res.data;
      } else {
        throw "load " + href + " error status:" + res.status;
      }
    });
  });

  const promise = Promise.all(reqs) as LoadResource
  promise.continue = (exts) => loadResource(href, exts, false)
  return promise;
};
