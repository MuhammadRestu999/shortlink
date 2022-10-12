$("document").ready(function() {
  $("form").on("submit", function() {
    $.post("/api/login", $("form").serialize())
      .then(function(data) {
        $(".alert-success > span").text(data.message);
        $(".alert-success")[0].hidden = !1;
        $(".alert-danger")[0].hidden = !0;
        setTimeout(() => location.href = "/", 500);
      })
      .catch(function(data) {
        $(".alert-danger > span").text(data.responseJSON.message)
        $(".alert-danger")[0].hidden = !1;
      });
  });
});
