package com.ats.frontend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.ui.Model;

@Controller
@RequestMapping("/applicants")
public class ApplicantWebController {

    @GetMapping({"", "/"})
    public String listPage() {
        return "applicants/list";
    }

    @GetMapping("/create")
    public String createPage() {
        return "applicants/create";
    }

    @GetMapping("/archived")
    public String archivedPage() {
        return "applicants/archived";
    }

    @GetMapping("/{id}/edit")
    public String editPage(@PathVariable String id, Model model) {
        model.addAttribute("applicantId", id);
        return "applicants/edit";
    }

    @GetMapping("/{id}")
    public String detailPage(@PathVariable String id, Model model) {
        model.addAttribute("applicantId", id);
        return "applicants/detail";
    }
}
