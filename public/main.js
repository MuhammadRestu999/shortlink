$("document").ready(function() {
  $("form").on("submit", function() {
    $.post("/api/short", $("form").serialize())
      .then(function(data) {
        $(".alert-success > span").text(data.message);
        $(".alert-success")[0].hidden = !1;
        $(".alert-danger")[0].hidden = !0;
        $("button.btn.btn-primary")[0].hidden = !0;
        $("input[type=submit]")[0].hidden = !1;
        $("input[name=url]")[0].disabled = !1;
        $("input[type=text]")[0].disabled = !1;
      })
      .catch(function(data) {
        $(".alert-danger > span").text(data.responseJSON.message)
        $(".alert-danger")[0].hidden = !1;
        $("button.btn.btn-primary")[0].hidden = !0;
        $("input[type=submit]")[0].hidden = !1;
        $("input[name=url]")[0].disabled = !1;
        $("input[type=text]")[0].disabled = !1;
      });
    $("button.btn.btn-primary")[0].hidden = !1;
    $("input[type=submit]")[0].hidden = !0;
    $("input[name=url]")[0].disabled = !0;
    $("input[type=text]")[0].disabled = !0;
  });
});
