import Swal from "sweetalert2";

const baseOptions = {
  background: "#0f172a",
  color: "#e2e8f0",
  confirmButtonColor: "#2563eb",
  cancelButtonColor: "#475569",
  reverseButtons: true,
  customClass: {
    popup: "rounded-[24px] border border-white/10 shadow-2xl",
    title: "text-white",
    htmlContainer: "text-slate-300",
    confirmButton: "rounded-2xl px-5 py-3 font-medium",
    cancelButton: "rounded-2xl px-5 py-3 font-medium",
  },
};

export const popup = {
  success(title = "Berhasil", text = "") {
    return Swal.fire({
      ...baseOptions,
      icon: "success",
      title,
      text,
    });
  },

  error(title = "Terjadi Kesalahan", text = "") {
    return Swal.fire({
      ...baseOptions,
      icon: "error",
      title,
      text,
    });
  },

  info(title = "Informasi", text = "") {
    return Swal.fire({
      ...baseOptions,
      icon: "info",
      title,
      text,
    });
  },

  warning(title = "Peringatan", text = "") {
    return Swal.fire({
      ...baseOptions,
      icon: "warning",
      title,
      text,
    });
  },

  confirm({
    title = "Yakin?",
    text = "",
    confirmText = "Ya, lanjutkan",
    cancelText = "Batal",
    icon = "question",
  } = {}) {
    return Swal.fire({
      ...baseOptions,
      icon,
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
    });
  },

  toastSuccess(title = "Berhasil") {
    return Swal.fire({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2200,
      timerProgressBar: true,
      icon: "success",
      title,
      background: "#0f172a",
      color: "#e2e8f0",
      customClass: {
        popup: "rounded-2xl border border-white/10 shadow-xl",
        title: "text-sm font-medium",
      },
    });
  },

  toastError(title = "Terjadi kesalahan") {
    return Swal.fire({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2600,
      timerProgressBar: true,
      icon: "error",
      title,
      background: "#0f172a",
      color: "#e2e8f0",
      customClass: {
        popup: "rounded-2xl border border-white/10 shadow-xl",
        title: "text-sm font-medium",
      },
    });
  },

  detailModal({
    title = "Detail",
    html = "",
    width = 900,
  } = {}) {
    return Swal.fire({
      ...baseOptions,
      title,
      html,
      width,
      confirmButtonText: "Tutup",
    });
  },
};