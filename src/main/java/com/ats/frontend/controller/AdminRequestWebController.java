package com.ats.frontend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin-requests")
public class AdminRequestWebController {

    @GetMapping("/pending")
    public String pendingRequestsPage() {
        return "admin-requests/pending";
    }
}
