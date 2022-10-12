$("document").ready(function() {
  $("form").on("submit", function() {
    if($("#password")[0].value !== $("#rPassword")[0].value) {
      $(".alert-danger > span").text("Password not match :|");
      $(".alert-danger")[0].hidden = !1;
      return !1;
    };

    $.post("/api/register", $("form").serialize())
      .then(function(data) {
        $(".alert-success > span").text(data.message);
        $(".alert-success")[0].hidden = !1;
        $(".alert-danger")[0].hidden = !0;
      })
      .catch(function(data) {
        $(".alert-danger > span").text(data.responseJSON.message);
        $(".alert-danger")[0].hidden = !1;
      });
  });
});
