lfunction del(short, td) {
  td.disabled = !0;
  $.post("/api/delete", {
    short
  }).then(function(data) {
    td.disabled = !0;
    list();
    Swal.fire("Success", `Successfully deleted ${short}`, "success");
  }).catch((e) => {
    const msg = e.responseJSON ? e.responseJSON.message : e.responseText;
    Swal.fire("Error", msg, "error");
  });
};
function edit(short, td) {
  td.disabled = !0;
  Swal.fire({
    title: "Enter a new url",
    input: "text",
    inputAttributes: {
      autocapitalize: "off",
      required: true,
      pattern: "^(https?|ftp):\/\/[^\s/$.?#].[^\s]*|(minecraft|whatsapp):\/\/[^\s]*$"
    },
    showCancelButton: true,
    confirmButtonText: "Edit",
    showLoaderOnConfirm: true,
    preConfirm: (nw) => {
      $.post("/api/edit", {
        short,
        new: nw
      }).then(function(data) {
        td.disabled = !0;
        list();
        return true;
      }).catch((e) => {
        const msg = e.responseJSON ? e.responseJSON.message : e.responseText;
        Swal.showValidationMessage(msg);
      });
    },
    allowOutsideClick: () => false
  }).then((r) => {
    if(r.value) Swal.fire("Success", `Successfully edited ${short}`, "success");
    td.disabled = !1;
  });
};
function list() {
  $.get("/api/list")
    .then(function(data) {
      let result = "";
      for(let i of data) {
        result += `      <tr>
              <td>${i.number}</td>
              <td>${i.short}</td>
              <td>${i.url}</td>
              <td>${i.click}</td>
              <td onclick="del('${i.short}', this);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                  <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                </svg>
                Del
              </td>
              <td onclick="edit('${i.short}', this);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                  <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                </svg>
              </td>
            </tr>\n`
      }
      $("tbody").html(result.trim());
    });
};

$("document").ready(() => {
  list();
  $.post("/api/getKey").then((r) => {
    usrn.innerText = r.username;
    eml.innerText = r.email;
    pwd.innerText = r.password;
    key.innerText = r.apikey;
    hit.innerText = r.hit;
  }).catch(console.error);
});
